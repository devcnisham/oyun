import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { makeBooking, makeDb } from '@/test/fixtures';
import type { Database } from './types';
import { canReschedule } from './cancel-policy';

const state = vi.hoisted(() => ({ db: null as unknown, device: 'device-test-token' }));
const getTestDb = () => state.db as Database;

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, set: () => {} }),
  headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.9' }),
}));
vi.mock('next/cache', () => ({ revalidatePath: () => {} }));
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
    newId: (prefix: string) => `${prefix}_${++n}`,
    newBookingCode: () => `SA-B${String(++n).padStart(5, '0')}`,
    storageInfo: () => ({ shared: true }),
  };
});

import { rescheduleBooking } from './booking-actions';

const NOW = new Date('2026-10-12T04:00:00Z'); // 09:30 IST, Monday 12 Oct 2026
const BOOKING_ID = 'bk_0123456789ab';
const TURF_ID = 'turf_test';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);

  const fixture = makeDb({ halfPitch: false });
  state.db = fixture.db;

  const db = getTestDb();
  // Ensure turf exists with 06:00 to 23:00 operating hours
  const turf = db.turfs.find((t) => t.id === TURF_ID) || db.turfs[0];
  turf.id = TURF_ID;
  turf.openTime = '06:00';
  turf.closeTime = '23:00';

  // Add initial confirmed booking
  const b = makeBooking({
    id: BOOKING_ID,
    turfId: TURF_ID,
    date: '2026-10-13',
    hour: 18,
    status: 'confirmed',
    source: 'online',
    customerPhone: '9876543210',
  });
  db.bookings = [b];
  db.holds = [];
});

afterEach(() => {
  vi.useRealTimers();
});

describe('reschedule booking policy and actions', () => {
  test('canReschedule reflects 2-hour cutoff and rain policy rules', () => {
    const slot = { status: 'confirmed' as const, source: 'online' as const, date: '2026-10-12', hour: 11 };
    // 11:00 IST is 1.5 hours away from 09:30 IST -> fails regular cutoff
    expect(canReschedule(slot, false)).toBe(false);
    // But passes under weather disruption
    expect(canReschedule(slot, true)).toBe(true);

    // Cancelled or walk-in bookings cannot be rescheduled
    expect(canReschedule({ ...slot, status: 'cancelled' }, false)).toBe(false);
    expect(canReschedule({ ...slot, source: 'walk_in' }, false)).toBe(false);
  });

  test('refuses non-existent or invalid booking ID', async () => {
    const res1 = await rescheduleBooking('invalid_id', '2026-10-14', 19, '9876543210');
    expect(res1).toHaveProperty('error');

    const res2 = await rescheduleBooking('bk_ffffffffffff', '2026-10-14', 19, '9876543210');
    expect(res2).toEqual({ error: 'Booking not found' });
  });

  test('refuses rescheduling to past slots', async () => {
    // 08:00 on today 2026-10-12 is in the past (it is 09:30 now)
    const res = await rescheduleBooking(BOOKING_ID, '2026-10-12', 8, '9876543210');
    expect(res).toEqual({ error: 'Please choose an upcoming slot in the future' });
  });

  test('refuses rescheduling outside turf operating hours', async () => {
    // 03:00 is outside 06:00-23:00
    const res = await rescheduleBooking(BOOKING_ID, '2026-10-14', 3, '9876543210');
    expect(res).toHaveProperty('error');
    if ('error' in res) {
      expect(res.error).toContain('outside turf operating hours');
    }
  });

  test('refuses rescheduling if target slot is already booked by another confirmed booking', async () => {
    const db = getTestDb();
    // Add conflicting booking on 2026-10-14 at 20:00
    db.bookings.push(
      makeBooking({
        id: 'bk_abcdef123456',
        turfId: TURF_ID,
        date: '2026-10-14',
        hour: 20,
        status: 'confirmed',
      })
    );

    const res = await rescheduleBooking(BOOKING_ID, '2026-10-14', 20, '9876543210');
    expect(res).toEqual({ error: 'Selected slot is not available. Please choose another time.' });
  });

  test('refuses rescheduling if target slot is actively held by another player', async () => {
    const db = getTestDb();
    db.holds = [
      {
        id: 'hold_target',
        turfId: TURF_ID,
        pitch: 'full',
        date: '2026-10-14',
        hour: 19,
        holder: 'other_device',
        expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
      },
    ];

    const res = await rescheduleBooking(BOOKING_ID, '2026-10-14', 19, '9876543210');
    expect(res).toEqual({ error: 'Selected slot is not available. Please choose another time.' });
  });

  test('successfully reschedules an active booking to an open slot', async () => {
    const res = await rescheduleBooking(BOOKING_ID, '2026-10-14', 19, '9876543210');
    expect(res).toEqual({ ok: true });

    const db = getTestDb();
    const updated = db.bookings.find((b) => b.id === BOOKING_ID);
    expect(updated).toBeDefined();
    expect(updated?.date).toBe('2026-10-14');
    expect(updated?.hour).toBe(19);
    expect(updated?.originalSlot).toEqual({ date: '2026-10-13', hour: 18 });
    expect(updated?.rescheduledAt).toBeDefined();
  });
});
