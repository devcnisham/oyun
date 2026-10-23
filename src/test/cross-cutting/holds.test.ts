// Slot holds through the real booking actions (task P8-05): a hold locks a slot for one device, expires after
// 8 minutes, can be released early, and is consumed by the booking. The store and the browser cookie are faked
// in memory; everything else (pricing, availability, hold rules) is the production code.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { makeDb } from '@/test/fixtures';
import type { Database } from '@/modules/shared/database/types';

const state = vi.hoisted(() => ({ db: null as unknown, device: 'device-a-token-aaaaaaaaaaaa' }));
const getTestDb = () => state.db as Database;

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => (name === 'oyun_device' ? { value: state.device } : undefined), set: () => {} }),
  headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.7' }),
}));
vi.mock('next/cache', () => ({ revalidatePath: () => {}, revalidateTag: () => {} }));
vi.mock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId: null }) }));
vi.mock('@/modules/shared/lib/clerk', () => ({ clerkEnabled: false }));
vi.mock('@/modules/shared/backend/rate-limit', () => ({ rateLimit: () => true }));
vi.mock('@/modules/shared/database/store', () => {
  let n = 0;
  return {
    getDb: async () => state.db,
    // Like the real mutate: work on a private copy and keep it only when the function does not throw
    mutate: async (fn: (db: Database) => unknown) => {
      const copy = structuredClone(state.db as Database);
      const result = await fn(copy);
      state.db = copy;
      return result;
    },
    newId: (prefix: string) => `${prefix}_${++n}`,
    newBookingCode: () => `SA-T${String(++n).padStart(5, '0')}`,
    storageInfo: () => ({ shared: true }),
  };
});

import { createBookings, getSlotsForDate, holdSlots, releaseHolds } from '@/modules/web/backend/booking-actions';

const NOW = new Date('2026-10-12T04:00:00Z'); // 09:30 in India, a Monday
const DATE = '2026-10-13';
const HOUR = 18;
const A = 'device-a-token-aaaaaaaaaaaa';
const B = 'device-b-token-bbbbbbbbbbbb';

const as = (device: string) => {
  state.device = device;
};
const reasonOf = async () => (await getSlotsForDate('turf_test', DATE)).find((s) => s.hour === HOUR)?.reason;
const request = { turfId: 'turf_test', date: DATE, hours: [HOUR], promoCode: null, addOns: [], useWallet: false, phone: '9876543210', name: 'Asha' };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  state.db = makeDb().db;
  as(A);
});
afterEach(() => vi.useRealTimers());

describe('slot holds', () => {
  test('a hold locks the slot for other devices and keeps it open for its owner', async () => {
    expect((await holdSlots('turf_test', DATE, [HOUR])).ok).toBe(true);
    expect(await reasonOf()).toBeNull(); // the holder still sees it as theirs
    as(B);
    expect(await reasonOf()).toBe('held');
    const other = await holdSlots('turf_test', DATE, [HOUR]);
    expect(other.ok).toBe(false);
    expect(getTestDb().holds).toHaveLength(1);
  });

  test('after 8 minutes the hold has expired and another device can take the slot', async () => {
    await holdSlots('turf_test', DATE, [HOUR]);
    as(B);
    vi.setSystemTime(new Date(NOW.getTime() + 7 * 60_000));
    expect(await reasonOf()).toBe('held');
    vi.setSystemTime(new Date(NOW.getTime() + 8 * 60_000 + 1000));
    expect(await reasonOf()).toBeNull();
    expect((await holdSlots('turf_test', DATE, [HOUR])).ok).toBe(true);
    // the stale row was purged on write, only the new holder's hold remains
    expect(getTestDb().holds).toHaveLength(1);
  });

  test('releasing frees the slot at once and leaves other devices holds alone', async () => {
    await holdSlots('turf_test', DATE, [HOUR]);
    as(B);
    await holdSlots('turf_test', DATE, [HOUR + 1]);
    as(A);
    await releaseHolds();
    expect(getTestDb().holds.map((h) => h.hour)).toEqual([HOUR + 1]);
    as(B);
    expect(await reasonOf()).toBeNull();
  });

  test('holding again replaces the earlier hold from the same device', async () => {
    await holdSlots('turf_test', DATE, [HOUR]);
    await holdSlots('turf_test', DATE, [HOUR + 1]);
    expect(getTestDb().holds.map((h) => h.hour)).toEqual([HOUR + 1]);
  });

  test('booking a held slot consumes the hold and the slot shows as booked', async () => {
    await holdSlots('turf_test', DATE, [HOUR]);
    const res = await createBookings(request);
    expect('ids' in res && res.ids).toHaveLength(1);
    expect(getTestDb().holds).toHaveLength(0);
    as(B);
    expect(await reasonOf()).toBe('booked');
  });

  test('a device whose hold expired cannot book a slot someone else now holds', async () => {
    await holdSlots('turf_test', DATE, [HOUR]);
    vi.setSystemTime(new Date(NOW.getTime() + 9 * 60_000));
    as(B);
    await holdSlots('turf_test', DATE, [HOUR]);
    as(A);
    const res = await createBookings(request);
    expect('error' in res).toBe(true);
    expect(getTestDb().bookings).toHaveLength(0);
  });
});
