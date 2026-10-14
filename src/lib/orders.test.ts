import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb } from '@/test/fixtures';
import type { Database } from './types';

const state = vi.hoisted(() => ({ db: null as unknown, device: 'device-a-token-aaaaaaaaaaaa' }));
const getTestDb = () => state.db as Database;

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => (name === 'oyun_device' ? { value: state.device } : undefined), set: () => {} }),
  headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.7' }),
}));
vi.mock('next/cache', () => ({ revalidatePath: () => {}, revalidateTag: () => {} }));
vi.mock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId: null }) }));
vi.mock('./clerk', () => ({ clerkEnabled: false }));
vi.mock('./rate-limit', () => ({ rateLimit: () => true }));
vi.mock('./store', () => {
  let n = 0;
  return {
    getDb: async () => state.db,
    mutate: async (fn: (db: Database) => unknown) => {
      const copy = structuredClone(state.db as Database);
      const result = await fn(copy);
      state.db = copy;
      return result;
    },
    newId: (prefix: string) => `${prefix}_${String(++n).padStart(12, '0')}`,
    newBookingCode: () => `SA-T${String(++n).padStart(5, '0')}`,
    storageInfo: () => ({ shared: true }),
  };
});

import { cancelMyBooking, createBookings, getSlotsForDate } from './booking-actions';

const NOW = new Date('2026-10-12T04:00:00Z'); // 09:30 in India, Monday
const DATE = '2026-10-13';

describe('R010: One order per checkout', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    state.device = 'device-a-token-aaaaaaaaaaaa';
    const { db } = makeDb({ pricePerHour: 1000 });
    state.db = db;
  });

  it('creates one booking order with several items for multi-hour checkout', async () => {
    const res = await createBookings({
      turfId: 'turf_test',
      date: DATE,
      hours: [18, 19],
      promoCode: null,
      addOns: [],
      useWallet: false,
      phone: '9876543210',
      name: 'Rohan Sharma',
      size: 'full',
    });

    expect(res.error).toBeUndefined();
    expect(res.ids).toBeDefined();
    expect(res.ids).toHaveLength(1);

    const db = getTestDb();
    const order = db.bookings.find((b) => b.id === res.ids![0]);
    expect(order).toBeDefined();
    expect(order?.customerName).toBe('Rohan Sharma');
    expect(order?.hours).toEqual([18, 19]);
    expect(order?.items).toHaveLength(2);
    expect(order?.items?.[0].hour).toBe(18);
    expect(order?.items?.[1].hour).toBe(19);

    // Both hours are now occupied on the slot grid
    const slots = await getSlotsForDate('turf_test', DATE, 'full');
    const slot18 = slots.find((s) => s.hour === 18);
    const slot19 = slots.find((s) => s.hour === 19);
    expect(slot18?.available).toBe(false);
    expect(slot18?.reason).toBe('booked');
    expect(slot19?.available).toBe(false);
    expect(slot19?.reason).toBe('booked');

    // Cancelling the order cancels both slots in one action
    const cancelRes = await cancelMyBooking(order!.id, '9876543210');
    expect('ok' in cancelRes && cancelRes.ok).toBe(true);

    const refreshedSlots = await getSlotsForDate('turf_test', DATE, 'full');
    expect(refreshedSlots.find((s) => s.hour === 18)?.available).toBe(true);
    expect(refreshedSlots.find((s) => s.hour === 19)?.available).toBe(true);
  });
});
