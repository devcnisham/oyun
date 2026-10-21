import { describe, expect, test } from 'vitest';
import { diffV2Bookings, mapV2Block, mapV2Booking, mapV2Holds, parseRange, v2QuoteOf, type V2BookingRow } from './v2-bookings';

// 18:00-19:00 IST on 2026-10-20 is 12:30-13:30 UTC
const EVENING = '["2026-10-20 12:30:00+00","2026-10-20 13:30:00+00")';
// 00:30-01:30 IST on 2026-10-21 is 19:00-20:00 UTC on the 20th
const LATE = '["2026-10-20 19:00:00+00","2026-10-20 20:00:00+00")';

const row = (over: Partial<V2BookingRow> = {}): V2BookingRow => ({
  id: '11111111-1111-5111-8111-111111111111', legacy_id: 'bk_1', code: 'AB12CD34', holder: null,
  customer_name: 'Asha', customer_phone: '9876543210', source: 'online', status: 'confirmed', hold_expires_at: null,
  subtotal: 1000, discount: 100, wallet_used: 50, total: 850, advance_due: 150, amount_paid: 150,
  price_breakdown: {}, meta: {}, cancelled_at: null, cancel_reason: null, checked_in_at: null, created_at: '2026-10-19T10:00:00Z',
  venues: { slug: 'turf_a' }, players: { legacy_id: 'pl_9' },
  booking_items: [{ id: 'it_1', during: EVENING, price: 1000, bookables: { name: 'Full pitch' } }],
  ...over,
});

describe('parseRange', () => {
  test('reads a tstzrange', () => {
    const r = parseRange(EVENING)!;
    expect(r.end.getTime() - r.start.getTime()).toBe(3_600_000);
  });
  test('rejects garbage', () => expect(parseRange('nope')).toBeNull());
});

describe('mapV2Booking', () => {
  test('maps a confirmed booking to the app shape in IST', () => {
    const b = mapV2Booking(row())!;
    expect(b).toMatchObject({ id: 'bk_1', turfId: 'turf_a', date: '2026-10-20', hour: 18, hours: [18], status: 'confirmed', playerId: 'pl_9', amountPaid: 150, source: 'online' });
    expect(b.timeLabel).toBe('06:00 PM – 07:00 PM');
    expect(b.pricing).toMatchObject({ total: 850, walletDeduction: 50, promo: { amount: -100 } });
  });
  test('uses the uuid when there is no legacy id', () => {
    expect(mapV2Booking(row({ legacy_id: null }))!.id).toBe('11111111-1111-5111-8111-111111111111');
  });
  test('after-midnight slot belongs to the previous day with hour 24+', () => {
    const b = mapV2Booking(row({ booking_items: [{ id: 'i', during: LATE, price: 1, bookables: null }] }), () => 6)!;
    expect(b).toMatchObject({ date: '2026-10-20', hour: 24 });
  });
  test('half pitch comes from the bookable name', () => {
    const b = mapV2Booking(row({ booking_items: [{ id: 'i', during: EVENING, price: 1, bookables: { name: 'Half pitch B' } }] }))!;
    expect(b.pitch).toBe('B');
  });
  test('multi-hour order keeps every hour, sorted', () => {
    const b = mapV2Booking(row({ booking_items: [
      { id: 'b', during: '["2026-10-20 13:30:00+00","2026-10-20 14:30:00+00")', price: 1, bookables: null },
      { id: 'a', during: EVENING, price: 1, bookables: null },
    ] }))!;
    expect(b.hours).toEqual([18, 19]);
  });
  test('maps statuses, refunds and walk-ins', () => {
    expect(mapV2Booking(row({ status: 'completed' }))!.status).toBe('checked_in');
    expect(mapV2Booking(row({ status: 'cancelled', meta: { refunded: true } }))!.status).toBe('refunded');
    expect(mapV2Booking(row({ status: 'cancelled' }))!.status).toBe('cancelled');
    expect(mapV2Booking(row({ source: 'phone' }))!.source).toBe('walk_in');
  });
  test('holds and expired holds are not bookings', () => {
    expect(mapV2Booking(row({ status: 'held' }))).toBeNull();
    expect(mapV2Booking(row({ status: 'expired' }))).toBeNull();
  });
  test('carries app fields stored in meta', () => {
    const b = mapV2Booking(row({ meta: { addOns: [{ id: 'a', name: 'Ball', price: 50, qty: 1 }], paymentMode: 'advance', accountId: 'user_1', cashback: 20 } }))!;
    expect(b).toMatchObject({ paymentMode: 'advance', accountId: 'user_1', cashback: 20 });
    expect(b.addOns).toHaveLength(1);
  });
});

describe('holds and blocks', () => {
  test('a live hold becomes one SlotHold per slot', () => {
    const holds = mapV2Holds(row({ status: 'held', holder: 'dev1', hold_expires_at: '2026-10-20T12:00:00Z' }));
    expect(holds).toEqual([{ id: 'it_1', turfId: 'turf_a', date: '2026-10-20', hour: 18, holder: 'dev1', pitch: undefined, expiresAt: '2026-10-20T12:00:00Z' }]);
  });
  test('a confirmed booking is not a hold', () => {
    expect(mapV2Holds(row())).toEqual([]);
  });
  test('a block maps to its venue, date and hour', () => {
    const b = mapV2Block({ id: 'bl_1', reason: 'Rain', created_at: '2026-10-19T00:00:00Z', during: EVENING, venues: { slug: 'turf_a' } })!;
    expect(b).toMatchObject({ id: 'bl_1', turfId: 'turf_a', date: '2026-10-20', hour: 18, reason: 'Rain' });
  });
});

describe('diffV2Bookings', () => {
  const base = mapV2Booking(row())!;
  test('an edit to an existing booking becomes an update', () => {
    const { updates, created, moved } = diffV2Bookings([base], [{ ...base, status: 'checked_in', cashback: 20 }]);
    expect(created).toEqual([]);
    expect(moved).toEqual([]);
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({ id: 'bk_1', status: 'checked_in' });
    expect(updates[0].meta.cashback).toBe(20);
  });
  test('a refund is stored as a cancel with the refunded flag', () => {
    const u = diffV2Bookings([base], [{ ...base, status: 'refunded' }]).updates[0];
    expect(u.status).toBe('cancelled');
    expect(u.meta.refunded).toBe(true);
  });
  test('an unchanged booking sends nothing', () => {
    expect(diffV2Bookings([base], [{ ...base }])).toEqual({ updates: [], created: [], moved: [] });
  });
  test('a new booking is reported, not sent', () => {
    expect(diffV2Bookings([base], [base, { ...base, id: 'bk_new' }]).created).toEqual(['bk_new']);
  });
  test('moving a booking to another slot is reported, not sent', () => {
    const r = diffV2Bookings([base], [{ ...base, hour: 20, hours: [20] }]);
    expect(r.moved).toEqual(['bk_1']);
    expect(r.updates).toEqual([]);
  });
});

describe('v2QuoteOf', () => {
  test('splits the planner pricing into the stored quote', () => {
    const b = { ...mapV2Booking(row())!, pricing: { basePrice: 1000, adjustments: [], slotPrice: 1000, offer: { label: 'Offer', amount: -100 }, promo: { label: 'Promo', amount: -50 }, addOnTotal: 0, subtotal: 850, walletDeduction: 50, total: 800, advance: 120 } };
    expect(v2QuoteOf(b)).toMatchObject({ subtotal: 850, discount: 150, walletUsed: 50, total: 800, advanceDue: 120, legacyId: 'bk_1', source: 'online' });
  });
});
