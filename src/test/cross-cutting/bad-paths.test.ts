// Bad paths through the real booking actions (task RQ-Q4): the ways a checkout should be refused, and what
// must NOT change when it is. Money and slots are checked after every refusal. Store, cookie and clock are faked.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { makeBooking, makeDb, makePlayer } from '@/test/fixtures';
import type { Database } from '@/modules/shared/database/types';

const state = vi.hoisted(() => ({ db: null as unknown, device: 'device-a-token-aaaaaaaaaaaa' }));
const getTestDb = () => state.db as Database;

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => (name === 'oyun_device' ? { value: state.device } : undefined), set: () => {} }),
  headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.9' }),
}));
vi.mock('next/cache', () => ({ revalidatePath: () => {} }));
vi.mock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId: null }) }));
vi.mock('@/modules/shared/lib/clerk', () => ({ clerkEnabled: false }));
vi.mock('@/modules/shared/backend/rate-limit', () => ({ rateLimit: () => true }));
vi.mock('@/modules/shared/database/store', () => {
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

import { cancelMyBooking, createBookings, holdSlots, submitReview } from '@/modules/web/backend/booking-actions';

const NOW = new Date('2026-10-12T04:00:00Z'); // 09:30 in India, Monday 12 Oct
const DATE = '2026-10-13';
const HOUR = 18;
const base = { turfId: 'turf_test', date: DATE, hours: [HOUR], promoCode: null, addOns: [], useWallet: false, phone: '9876543210', name: 'Asha' };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  state.db = makeDb({ halfPitch: true }).db;
  state.device = 'device-a-token-aaaaaaaaaaaa';
});
afterEach(() => vi.useRealTimers());

const bookingsOnSlot = () => getTestDb().bookings.filter((b) => b.date === DATE && b.hour === HOUR);

describe('full pitch versus halves', () => {
  test('a half booked leaves one half: a full pitch is refused, the other half is fine, a third is refused', async () => {
    expect((await createBookings({ ...base, size: 'half' })).ids).toHaveLength(1);
    expect(bookingsOnSlot()[0].pitch).toBe('A');

    state.device = 'device-b-token-bbbbbbbbbbbb';
    const full = await createBookings({ ...base, phone: '9876500002', size: 'full' });
    expect(full.error).toBeTruthy();
    expect(bookingsOnSlot()).toHaveLength(1);

    expect((await createBookings({ ...base, phone: '9876500003', size: 'half' })).ids).toHaveLength(1);
    expect(bookingsOnSlot().map((b) => b.pitch).sort()).toEqual(['A', 'B']);

    state.device = 'device-c-token-cccccccccccc';
    const third = await createBookings({ ...base, phone: '9876500004', size: 'half' });
    expect(third.error).toBeTruthy();
    expect(bookingsOnSlot()).toHaveLength(2);
  });

  test('a full pitch booked refuses both a half and a second full pitch', async () => {
    expect((await createBookings({ ...base, size: 'full' })).ids).toHaveLength(1);
    state.device = 'device-b-token-bbbbbbbbbbbb';
    expect((await createBookings({ ...base, phone: '9876500002', size: 'half' })).error).toBeTruthy();
    expect((await createBookings({ ...base, phone: '9876500002', size: 'full' })).error).toBeTruthy();
    expect(bookingsOnSlot()).toHaveLength(1);
  });

  test('holding one half stops another device holding the full pitch but not the other half', async () => {
    expect((await holdSlots('turf_test', DATE, [HOUR], 'half')).ok).toBe(true);
    state.device = 'device-b-token-bbbbbbbbbbbb';
    expect((await holdSlots('turf_test', DATE, [HOUR], 'full')).ok).toBe(false);
    expect((await holdSlots('turf_test', DATE, [HOUR], 'half')).ok).toBe(true);
    expect(getTestDb().holds.map((h) => h.pitch).sort()).toEqual(['A', 'B']);
  });
});

describe('refused checkouts change nothing', () => {
  test('an expired promo code refuses the booking, with no booking, no wallet movement and no promo use', async () => {
    const db = getTestDb();
    db.promoCodes.push({ code: 'OLD', kind: 'percent', value: 50, maxDiscount: null, weekendOnly: false, active: true, uses: 0, expiresOn: '2026-10-01' });
    const player = makePlayer({ phone: '9876543210', walletBalance: 500 });
    db.players.push(player);
    const res = await createBookings({ ...base, promoCode: 'OLD', useWallet: true });
    expect(res.error).toMatch(/expired/i);
    expect(getTestDb().bookings).toHaveLength(0);
    expect(getTestDb().players[0].walletBalance).toBe(500);
    expect(getTestDb().promoCodes[0].uses).toBe(0);
    expect(getTestDb().walletTxns).toHaveLength(0);
  });

  test('a fully used promo code is refused', async () => {
    getTestDb().promoCodes.push({ code: 'FULL', kind: 'flat', value: 100, maxDiscount: null, weekendOnly: false, active: true, uses: 5, maxUses: 5 });
    const res = await createBookings({ ...base, promoCode: 'FULL' });
    expect(res.error).toMatch(/fully used/i);
    expect(getTestDb().bookings).toHaveLength(0);
  });

  test('a banned player cannot book', async () => {
    getTestDb().players.push(makePlayer({ phone: '9876543210', status: 'banned' }));
    const res = await createBookings(base);
    expect(res.error).toMatch(/cannot make bookings/i);
    expect(getTestDb().bookings).toHaveLength(0);
  });

  test('dates in the past or beyond the booking window, and past hours today, are refused', async () => {
    expect((await createBookings({ ...base, date: '2026-10-11' })).error).toBeTruthy();
    expect((await createBookings({ ...base, date: '2026-12-25' })).error).toBeTruthy();
    expect((await createBookings({ ...base, date: '2026-10-12', hours: [7] })).error).toBeTruthy(); // 07:00 is before 09:30
    expect(getTestDb().bookings).toHaveLength(0);
  });

  test('a wallet with less than the price pays only what it has, and never goes below zero', async () => {
    getTestDb().players.push(makePlayer({ phone: '9876543210', walletBalance: 300 }));
    const res = await createBookings({ ...base, useWallet: true });
    expect(res.ids).toHaveLength(1);
    const after = getTestDb();
    expect(after.players[0].walletBalance).toBe(0);
    expect(after.bookings[0].pricing.walletDeduction).toBe(300);
    expect(after.bookings[0].pricing.total).toBe(after.bookings[0].pricing.subtotal - 300);
  });

  test('a wallet cannot be spent by a phone number with no player', async () => {
    const res = await createBookings({ ...base, useWallet: true });
    expect(res.ids).toHaveLength(1);
    expect(getTestDb().bookings[0].pricing.walletDeduction).toBe(0);
  });
});

describe('cancelling', () => {
  const PHONE = '9876543210'; // the fixture booking's customerPhone
  const online = (over = {}) => {
    const b = makeBooking({ id: 'bk_abcdef012345', date: DATE, hour: HOUR, source: 'online', paymentMode: 'venue', amountPaid: 0, ...over });
    getTestDb().bookings.push(b);
    return b;
  };

  test('cancelling twice is refused the second time, and a refund is paid once', async () => {
    const player = makePlayer({ walletBalance: 0 });
    getTestDb().players.push(player);
    const b = online({ playerId: player.id, pricing: { ...makeBooking().pricing, walletDeduction: 200 } });
    expect(await cancelMyBooking(b.id, PHONE)).toEqual({ ok: true });
    expect(getTestDb().players[0].walletBalance).toBe(200);
    expect(await cancelMyBooking(b.id, PHONE)).toMatchObject({ error: expect.stringMatching(/no longer be cancelled/) });
    expect(getTestDb().players[0].walletBalance).toBe(200);
    expect(getTestDb().walletTxns).toHaveLength(1);
  });

  test('inside the 2 hour cutoff the player must call the turf, and nothing changes', async () => {
    vi.setSystemTime(new Date('2026-10-13T11:30:00Z')); // 17:00 India, one hour before the 18:00 slot
    const b = online();
    const res = await cancelMyBooking(b.id, PHONE);
    expect(res).toMatchObject({ error: expect.stringMatching(/2 hours/) });
    expect(getTestDb().bookings[0].status).toBe('confirmed');
  });

  test('an anonymous booking needs the booking phone number: the id alone is refused and nothing changes', async () => {
    const b = online();
    for (const wrong of [undefined, '', '9876500000', '12345']) {
      expect(await cancelMyBooking(b.id, wrong)).toMatchObject({ error: expect.stringMatching(/mobile number used for this booking/) });
    }
    expect(getTestDb().bookings[0].status).toBe('confirmed');
    expect(await cancelMyBooking(b.id, '+91 98765 43210')).toEqual({ ok: true });
  });

  test('an anonymous booking review needs the booking phone number too', async () => {
    const b = online({ status: 'checked_in' });
    expect(await submitReview(b.id, 5, 'Great')).toMatchObject({ error: expect.stringMatching(/mobile number used for this booking/) });
    expect(getTestDb().bookings[0].review).toBeUndefined();
    expect(await submitReview(b.id, 5, 'Great', PHONE)).toEqual({ ok: true });
  });

  test('an id that is not a booking id, or an unknown one, is refused', async () => {
    expect(await cancelMyBooking('not-an-id')).toMatchObject({ error: 'Booking not found' });
    expect(await cancelMyBooking('bk_000000000000')).toMatchObject({ error: 'Booking not found' });
  });
});
