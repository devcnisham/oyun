import { describe, expect, test } from 'vitest';
import { EARLY, MONDAY, SATURDAY, makeBooking, makeDb, makePlayer } from '@/test/fixtures';
import {
  DEFAULT_PRICING,
  advanceDue,
  bestOffer,
  buildQuote,
  freePart,
  getSlots,
  gstSplit,
  hourlyRate,
  normalizePhone,
  promoDiscount,
  promoRestriction,
  slotPrice,
  turfHours,
} from './pricing';
import type { Offer, PromoCode } from './types';

const promo = (over: Partial<PromoCode>): PromoCode => ({ code: 'PLAY', kind: 'percent', value: 10, maxDiscount: null, weekendOnly: false, active: true, uses: 0, ...over });
const offer = (over: Partial<Offer>): Offer => ({ id: 'o', turfId: 'turf_test', type: 'happy_hour', title: 'Deal', percentOff: 10, startHour: 6, endHour: 10, active: true, createdAt: '', ...over });
const later = () => new Date(Date.now() + 10 * 60_000).toISOString();

describe('basic helpers', () => {
  test('normalizePhone keeps the last 10 digits', () => {
    expect(normalizePhone('+91 98765 43210')).toBe('9876543210');
    expect(normalizePhone('98765-43210')).toBe('9876543210');
  });

  test('turfHours treats a close at or before open as midnight', () => {
    const { turf } = makeDb({ openTime: '18:00', closeTime: '00:00' });
    expect(turfHours(turf)).toEqual([18, 19, 20, 21, 22, 23]);
  });

  test('half pitch costs the half percentage rounded to ₹10, only on half-pitch turfs', () => {
    const { turf } = makeDb({ pricePerHour: 1250, halfPitch: true, halfPricePercent: 55 });
    expect(hourlyRate(turf, 'half')).toBe(690);
    expect(hourlyRate({ ...turf, halfPitch: false }, 'half')).toBe(1250);
  });

  test('gstSplit adds back up to the total', () => {
    for (const total of [1000, 1180, 999, 1]) {
      const g = gstSplit(total, 18);
      expect(g.taxable + g.tax).toBe(total);
      expect(g.cgst + g.sgst).toBe(g.tax);
    }
    expect(gstSplit(1180, 18)).toEqual({ taxable: 1000, tax: 180, cgst: 90, sgst: 90 });
  });
});

describe('slotPrice', () => {
  const { turf } = makeDb();

  test('weekday off-peak is the base price', () => {
    expect(slotPrice(turf, DEFAULT_PRICING, MONDAY, 10, EARLY).price).toBe(1000);
  });

  test('peak and weekend markups are both computed on base, not stacked', () => {
    const p = slotPrice(turf, DEFAULT_PRICING, SATURDAY, 18, EARLY);
    expect(p.price).toBe(1000 + 300 + 150);
    expect(p.tags).toEqual(['Peak', 'Weekend']);
  });

  test('peak window end is exclusive', () => {
    expect(slotPrice(turf, DEFAULT_PRICING, MONDAY, 22, EARLY).price).toBe(1000);
  });

  test('last-minute discount applies within the window on the same day only', () => {
    const now = { date: MONDAY, hour: 9, minute: 0 };
    expect(slotPrice(turf, DEFAULT_PRICING, MONDAY, 11, now).price).toBe(750);
    expect(slotPrice(turf, DEFAULT_PRICING, MONDAY, 12, now).price).toBe(1000);
  });

  test('disabled rules change nothing', () => {
    const off = { ...DEFAULT_PRICING, peakEnabled: false, weekendEnabled: false };
    expect(slotPrice(turf, off, SATURDAY, 18, EARLY).price).toBe(1000);
  });
});

describe('promo codes and offers', () => {
  test('percent promo respects its maximum discount', () => {
    expect(promoDiscount(promo({ value: 50, maxDiscount: 200 }), 1000, MONDAY)).toEqual({ amount: 200, error: null });
  });

  test('flat promo never takes the price below zero', () => {
    expect(promoDiscount(promo({ kind: 'flat', value: 5000 }), 1000, MONDAY).amount).toBe(1000);
  });

  test('inactive and weekend-only codes are refused with a reason', () => {
    expect(promoDiscount(promo({ active: false }), 1000, MONDAY)).toEqual({ amount: 0, error: 'This promo code has expired' });
    expect(promoDiscount(promo({ weekendOnly: true }), 1000, MONDAY).error).toMatch(/weekends only/);
    expect(promoDiscount(promo({ weekendOnly: true }), 1000, SATURDAY).error).toBeNull();
  });

  test('only the single best offer applies', () => {
    const offers = [offer({ percentOff: 10 }), offer({ id: 'o2', type: 'first_time', percentOff: 20 })];
    expect(bestOffer(offers, 8, true, 1000)?.amount).toBe(-200);
    expect(bestOffer(offers, 8, false, 1000)?.amount).toBe(-100);
    expect(bestOffer(offers, 12, false, 1000)).toBeNull();
    expect(bestOffer([offer({ active: false })], 8, true, 1000)).toBeNull();
  });
});

describe('advanceDue', () => {
  test('defaults ask a flat ₹150 per hour, never more than the price', () => {
    const s = { advancePercent: 10, minAdvance: 150, maxAdvance: 150 };
    expect(advanceDue(s, 1000)).toBe(150);
    expect(advanceDue(s, 3000)).toBe(150);
    expect(advanceDue(s, 120)).toBe(120);
    expect(advanceDue(s, 0)).toBe(0);
  });

  test('the percentage shows between the limits', () => {
    const s = { advancePercent: 20, minAdvance: 100, maxAdvance: 500 };
    expect(advanceDue(s, 1000)).toBe(200);
    expect(advanceDue(s, 300)).toBe(100);
    expect(advanceDue(s, 5000)).toBe(500);
  });
});

describe('slot availability', () => {
  test('a booked, blocked or held slot is not available; past hours are past', () => {
    const { db, turf } = makeDb();
    db.bookings.push(makeBooking({ hour: 18 }));
    db.blocks.push({ id: 'b', turfId: turf.id, date: MONDAY, hour: 19, reason: 'maintenance', createdAt: '' } as never);
    db.holds.push({ id: 'h', turfId: turf.id, date: MONDAY, hour: 20, holder: 'someone-else', expiresAt: later() });
    const slots = getSlots(db, turf, MONDAY, { date: MONDAY, hour: 7, minute: 0 }, 'me');
    const reason = (h: number) => slots.find((s) => s.hour === h)?.reason;
    expect([reason(6), reason(18), reason(19), reason(20), reason(21)]).toEqual(['past', 'booked', 'blocked', 'held', null]);
  });

  test('your own hold stays available to you; an expired hold frees the slot', () => {
    const { db, turf } = makeDb();
    db.holds.push({ id: 'h1', turfId: turf.id, date: MONDAY, hour: 20, holder: 'me', expiresAt: later() });
    db.holds.push({ id: 'h2', turfId: turf.id, date: MONDAY, hour: 21, holder: 'other', expiresAt: new Date(Date.now() - 1000).toISOString() });
    const slots = getSlots(db, turf, MONDAY, EARLY, 'me');
    expect(slots.find((s) => s.hour === 20)).toMatchObject({ available: true, heldByYou: true });
    expect(slots.find((s) => s.hour === 21)?.available).toBe(true);
  });

  test('cancelled bookings do not take the slot', () => {
    const { db, turf } = makeDb();
    db.bookings.push(makeBooking({ hour: 18, status: 'cancelled' }));
    expect(getSlots(db, turf, MONDAY, EARLY).find((s) => s.hour === 18)?.available).toBe(true);
  });

  test('half pitch: two halves fit in one hour, then the hour is full; a full booking blocks both', () => {
    const { db, turf } = makeDb({ halfPitch: true });
    expect(freePart(db, turf, MONDAY, 18, 'half', null)).toBe('A');
    db.bookings.push(makeBooking({ hour: 18, pitch: 'A' }));
    expect(freePart(db, turf, MONDAY, 18, 'half', null)).toBe('B');
    expect(freePart(db, turf, MONDAY, 18, 'full', null)).toBeNull();
    db.bookings.push(makeBooking({ hour: 18, pitch: 'B' }));
    expect(freePart(db, turf, MONDAY, 18, 'half', null)).toBeNull();
    db.bookings.push(makeBooking({ hour: 19 }));
    expect(freePart(db, turf, MONDAY, 19, 'half', null)).toBeNull();
  });

  test('half pitch: a player who asks for Right or Left only gets that side', () => {
    const { db, turf } = makeDb({ halfPitch: true });
    expect(freePart(db, turf, MONDAY, 18, 'half', null, 'B')).toBe('B');
    db.bookings.push(makeBooking({ hour: 18, pitch: 'B' }));
    expect(freePart(db, turf, MONDAY, 18, 'half', null, 'B')).toBeNull();
    expect(freePart(db, turf, MONDAY, 18, 'half', null, 'A')).toBe('A');
    const slot = (side: 'A' | 'B') => getSlots(db, turf, MONDAY, EARLY, null, false, 'half', side).find((s) => s.hour === 18);
    expect(slot('B')?.available).toBe(false);
    expect(slot('B')?.reason).toBe('booked');
    expect(slot('A')?.available).toBe(true);
    // Without a side, any free half will do
    expect(getSlots(db, turf, MONDAY, EARLY, null, false, 'half').find((s) => s.hour === 18)?.available).toBe(true);
  });
});

describe('buildQuote', () => {
  test('unknown turf gives no quote', () => {
    const { db } = makeDb();
    expect(buildQuote(db, { turfId: 'nope', date: MONDAY, hour: 10 }, EARLY)).toBeNull();
  });

  test('wallet covers at most the subtotal and comes off the total', () => {
    const { db, turf } = makeDb();
    db.players.push(makePlayer({ phone: '9876543210', walletBalance: 5000 }));
    const q = buildQuote(db, { turfId: turf.id, date: MONDAY, hour: 10, phone: '9876543210', useWallet: true }, EARLY)!;
    expect(q.breakdown).toMatchObject({ subtotal: 1000, walletDeduction: 1000, total: 0, advance: 0 });
  });

  test('a banned player cannot spend their wallet', () => {
    const { db, turf } = makeDb();
    db.players.push(makePlayer({ phone: '9876543210', walletBalance: 500, status: 'banned' }));
    const q = buildQuote(db, { turfId: turf.id, date: MONDAY, hour: 10, phone: '9876543210', useWallet: true }, EARLY)!;
    expect(q.breakdown.walletDeduction).toBe(0);
  });

  test('promo codes are matched case-insensitively; unknown codes report an error and change nothing', () => {
    const { db, turf } = makeDb();
    db.promoCodes.push(promo({ code: 'PLAY10', value: 10 }));
    const ok = buildQuote(db, { turfId: turf.id, date: MONDAY, hour: 10, promoCode: ' play10 ' }, EARLY)!;
    expect(ok).toMatchObject({ promoCode: 'PLAY10', promoError: null });
    expect(ok.breakdown.total).toBe(900);
    const bad = buildQuote(db, { turfId: turf.id, date: MONDAY, hour: 10, promoCode: 'NOPE' }, EARLY)!;
    expect(bad).toMatchObject({ promoCode: null, promoError: 'Invalid promo code' });
    expect(bad.breakdown.total).toBe(1000);
  });

  test('add-ons: only active ones for this turf, quantity clamped to 20', () => {
    const { db, turf } = makeDb();
    db.addOns.push({ id: 'bib', turfId: turf.id, name: 'Bibs', price: 50, active: true } as never);
    db.addOns.push({ id: 'off', turfId: turf.id, name: 'Old', price: 999, active: false } as never);
    const q = buildQuote(db, { turfId: turf.id, date: MONDAY, hour: 10, addOns: [{ id: 'bib', qty: 99 }, { id: 'off', qty: 1 }, { id: 'ghost', qty: 1 }] }, EARLY)!;
    expect(q.addOns).toEqual([{ id: 'bib', name: 'Bibs', price: 50, qty: 20 }]);
    expect(q.breakdown.total).toBe(2000);
  });

  test('first-time offer only for a phone with no earlier live booking, never for walk-ins', () => {
    const { db, turf } = makeDb();
    db.offers.push(offer({ type: 'first_time', percentOff: 20 }));
    const fresh = buildQuote(db, { turfId: turf.id, date: MONDAY, hour: 10, phone: '9000000001' }, EARLY)!;
    expect(fresh.firstTime).toBe(true);
    expect(fresh.breakdown.total).toBe(800);
    db.bookings.push(makeBooking({ customerPhone: '9000000001', hour: 6 }));
    expect(buildQuote(db, { turfId: turf.id, date: MONDAY, hour: 10, phone: '9000000001' }, EARLY)!.firstTime).toBe(false);
    expect(buildQuote(db, { turfId: turf.id, date: MONDAY, hour: 10, phone: '9000000002', source: 'walk_in' }, EARLY)!.breakdown.total).toBe(1000);
  });

  test('an unavailable slot is reported', () => {
    const { db, turf } = makeDb();
    db.bookings.push(makeBooking({ hour: 10 }));
    expect(buildQuote(db, { turfId: turf.id, date: MONDAY, hour: 10 }, EARLY)!.slotError).toBe('This slot is not available');
  });
});

describe('promo code limits', () => {
  const PHONE = '9876543210';

  test('no limits set means no restriction, including on old codes without the new fields', () => {
    expect(promoRestriction(promo({}), '2026-10-12', '')).toBeNull();
  });

  test('a code works through its last day and not after', () => {
    const p = promo({ expiresOn: '2026-10-12' });
    expect(promoRestriction(p, '2026-10-12', PHONE)).toBeNull();
    expect(promoRestriction(p, '2026-10-13', PHONE)).toMatch(/expired/);
  });

  test('a code stops when its total uses are reached', () => {
    expect(promoRestriction(promo({ maxUses: 5, uses: 4 }), '2026-10-12', PHONE)).toBeNull();
    expect(promoRestriction(promo({ maxUses: 5, uses: 5 }), '2026-10-12', PHONE)).toMatch(/fully used/);
  });

  test('a per-player limit counts by phone number and needs a phone number', () => {
    const p = promo({ perPlayerLimit: 1, redeemedBy: { [PHONE]: 1 } });
    expect(promoRestriction(p, '2026-10-12', PHONE)).toMatch(/already used/);
    expect(promoRestriction(p, '2026-10-12', '9000000000')).toBeNull();
    expect(promoRestriction(p, '2026-10-12', '')).toMatch(/phone number/);
  });

  test('a limited code gives no discount once restricted, and the quote says why', () => {
    const { db, turf } = makeDb();
    db.promoCodes.push(promo({ code: 'ONCE', value: 10, perPlayerLimit: 1, redeemedBy: { [PHONE]: 1 } }));
    const q = buildQuote(db, { turfId: turf.id, date: MONDAY, hour: 10, promoCode: 'ONCE', phone: PHONE }, EARLY)!;
    expect(q.promoCode).toBeNull();
    expect(q.promoError).toMatch(/already used/);
    expect(q.breakdown.total).toBe(1000);
    const fresh = buildQuote(db, { turfId: turf.id, date: MONDAY, hour: 10, promoCode: 'ONCE', phone: '9000000000' }, EARLY)!;
    expect(fresh).toMatchObject({ promoCode: 'ONCE', promoError: null });
    expect(fresh.breakdown.total).toBe(900);
  });

  test('an expired code is refused in the quote using today in India time', () => {
    const { db, turf } = makeDb();
    db.promoCodes.push(promo({ code: 'OLD', expiresOn: '2026-09-30' }));
    const q = buildQuote(db, { turfId: turf.id, date: MONDAY, hour: 10, promoCode: 'OLD' }, EARLY)!;
    expect(q.promoError).toMatch(/expired/);
  });
});
