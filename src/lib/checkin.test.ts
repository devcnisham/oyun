// Check-in and cash (task P9-11): a booking with a balance due cannot be checked in until the desk confirms
// it collected the cash, and the confirmation is stored on the booking. Store and session are faked in memory.
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { makeBooking, makeDb } from '@/test/fixtures';
import { istNow } from './time';
import type { Booking, Database } from './types';

const state = vi.hoisted(() => ({ db: null as unknown }));
const getTestDb = () => state.db as Database;

vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock('next/cache', () => ({ revalidatePath: () => {} }));
vi.mock('./partner-auth', () => {
  class AccessError extends Error {}
  return {
    AccessError,
    TURF_COOKIE: 'sa_partner_turf',
    getPartnerContext: async () => null,
    requirePartnerAction: async () => ({ turf: { id: 'turf_test' }, userName: 'Front Desk Ravi', can: () => true }),
  };
});
vi.mock('./store', () => ({
  getDb: async () => state.db,
  mutate: async (fn: (db: Database) => unknown) => {
    const copy = structuredClone(state.db as Database);
    const result = await fn(copy);
    state.db = copy;
    return result;
  },
  newId: (prefix: string) => `${prefix}_x`,
  newBookingCode: () => 'SA-NEW001',
}));

import { checkInBooking } from './partner-actions';

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};
const addBooking = (over: Partial<Booking> = {}) => {
  const b = makeBooking({ date: istNow().date, paymentMode: 'venue', amountPaid: 0, ...over });
  getTestDb().bookings.push(b);
  return b;
};
const stored = (id: string) => getTestDb().bookings.find((b) => b.id === id)!;

beforeEach(() => {
  state.db = makeDb().db;
});

describe('check-in and cash', () => {
  test('a balance due blocks check-in until the desk confirms the cash', async () => {
    const b = addBooking();
    const res = await checkInBooking(null, form({ bookingId: b.id }));
    expect(res?.error).toMatch(/₹1000 is due/);
    expect(res?.data).toMatchObject({ due: '1000', code: b.code });
    expect(stored(b.id)).toMatchObject({ status: 'confirmed', amountPaid: 0 });
    expect(stored(b.id).cashCollected).toBeUndefined();
  });

  test('confirming the cash checks the player in and records who took how much', async () => {
    const b = addBooking();
    const res = await checkInBooking(null, form({ bookingId: b.id, cashCollected: 'true' }));
    expect(res?.ok).toMatch(/₹1000 collected/);
    const after = stored(b.id);
    expect(after.status).toBe('checked_in');
    expect(after.amountPaid).toBe(1000);
    expect(after.cashCollected).toMatchObject({ amount: 1000, by: 'Front Desk Ravi' });
  });

  test('checking in by code works the same way', async () => {
    const b = addBooking();
    expect((await checkInBooking(null, form({ code: b.code })))?.error).toMatch(/due/);
    expect((await checkInBooking(null, form({ code: b.code, cashCollected: 'true' })))?.ok).toMatch(/checked in/);
  });

  test('nothing is due when the booking is already paid, so no confirmation is needed', async () => {
    const b = addBooking({ paymentMode: 'full', amountPaid: 1000 });
    const res = await checkInBooking(null, form({ bookingId: b.id }));
    expect(res?.ok).toMatch(/checked in/);
    expect(stored(b.id).cashCollected).toBeUndefined();
  });

  test('a second check-in is still refused, and other days and turfs are too', async () => {
    const b = addBooking();
    await checkInBooking(null, form({ bookingId: b.id, cashCollected: 'true' }));
    expect((await checkInBooking(null, form({ bookingId: b.id, cashCollected: 'true' })))?.error).toMatch(/already checked in/);
    const later = addBooking({ date: '2099-01-01' });
    expect((await checkInBooking(null, form({ bookingId: later.id, cashCollected: 'true' })))?.error).toMatch(/not today/);
    const other = addBooking({ turfId: 'turf_other' });
    expect((await checkInBooking(null, form({ bookingId: other.id, cashCollected: 'true' })))?.error).toMatch(/another turf/);
  });
});
