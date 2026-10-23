// With relational slots active the store drops bookings and holds written through mutate() (R008). The booking
// actions must therefore refuse rather than fall back to that path and hand the player a ticket that was never saved.
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { makeDb } from '@/test/fixtures';
import type { Database } from '@/modules/shared/database/types';

const state = vi.hoisted(() => ({ db: null as unknown, held: null as unknown, mutateCalls: 0, holdResult: null as unknown, confirmResult: null as unknown }));
const getTestDb = () => state.db as Database;

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (n: string) => (n === 'oyun_device' ? { value: 'device-a-token-aaaaaaaaaaaa' } : undefined), set: () => {} }),
  headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.9' }),
}));
vi.mock('next/cache', () => ({ revalidatePath: () => {} }));
vi.mock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId: null }) }));
vi.mock('@/modules/shared/lib/clerk', () => ({ clerkEnabled: false }));
vi.mock('@/modules/shared/backend/rate-limit', () => ({ rateLimit: () => true }));
vi.mock('@/modules/shared/backend/shared-rate-limit', () => ({ sharedRateLimit: async () => true }));
vi.mock('@/modules/shared/database/store', () => ({
  getDb: async () => state.db,
  mutate: async (fn: (db: Database) => unknown) => {
    state.mutateCalls++;
    const copy = structuredClone(state.db as Database);
    const result = await fn(copy);
    state.db = copy;
    return result;
  },
  newId: (p: string) => `${p}_1`,
  newBookingCode: () => 'SA-B00001',
  storageInfo: () => ({ shared: true, backend: 'supabase' }),
}));
vi.mock('@/modules/shared/database/v2-slots', () => ({
  isV2SlotsActive: () => true,
  v2GetSlotsForDate: async () => [],
  v2HoldSlots: async () => state.holdResult,
  v2ConfirmHoldPriced: async () => state.confirmResult,
  v2ReleaseHolds: async () => {},
  v2CancelBooking: async () => null,
}));
vi.mock('@/modules/shared/database/supabase/admin', () => ({
  createAdminClient: () => ({
    schema: () => ({
      from: () => {
        const q: Record<string, unknown> = {};
        for (const m of ['select', 'eq', 'gt', 'order', 'limit']) q[m] = () => q;
        q.maybeSingle = async () => ({ data: state.held });
        q.upsert = async () => ({ error: null });
        return q;
      },
    }),
  }),
}));

import { createBookings, holdSlots } from '@/modules/web/backend/booking-actions';

const NOW = new Date('2026-10-12T04:00:00Z');
const base = { turfId: 'turf_test', date: '2026-10-13', hours: [18], promoCode: null, addOns: [], useWallet: false, phone: '9876543210', name: 'Asha' };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  state.db = makeDb({}).db;
  state.held = null;
  state.mutateCalls = 0;
  state.holdResult = null;
  state.confirmResult = null;
});

describe('relational slots on: no fallback to the legacy store', () => {
  test('booking with no live hold is refused and writes nothing through mutate', async () => {
    const res = await createBookings(base);
    expect(res.ids).toBeUndefined();
    expect(res.error).toMatch(/hold has expired/i);
    expect(state.mutateCalls).toBe(0);
    expect(getTestDb().bookings).toHaveLength(0);
  });

  test('a held booking whose confirmation cannot be reached is refused too', async () => {
    state.held = { id: 'bk_1', venue_id: 'v_1', venues: { slug: 'turf_test' } };
    state.confirmResult = null;
    const res = await createBookings(base);
    expect(res.ids).toBeUndefined();
    expect(res.error).toBeTruthy();
    // Nothing is charged to the wallet or counted against a promo code when the booking was not confirmed
    expect(state.mutateCalls).toBe(0);
  });

  test('a confirmed hold books, then applies the wallet, promo and player changes once', async () => {
    state.held = { id: 'bk_1', venue_id: 'v_1', venues: { slug: 'turf_test' } };
    state.confirmResult = { ok: true, booking: { code: 'AB12CD34' } };
    const res = await createBookings(base);
    expect(res.error).toBeUndefined();
    expect(res.ids).toHaveLength(1);
    expect(state.mutateCalls).toBe(1);
    // The booking itself lives in oyun: the store's own list gets no copy
    expect(getTestDb().bookings).toHaveLength(0);
  });

  test('holding a turf with no relational setup is refused instead of saving a hold that would be dropped', async () => {
    state.holdResult = null;
    const res = await holdSlots('turf_test', '2026-10-13', [18]);
    expect(res.ok).toBe(false);
    expect(state.mutateCalls).toBe(0);
    expect(getTestDb().holds).toHaveLength(0);
  });
});
