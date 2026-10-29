import { expect, test } from 'vitest';
import { paymentAmounts } from './payment-options';
import { planBooking } from './booking-plan';
import { seed } from '@/modules/shared/database/seed';

test('30% advance rounds once on the final order and leaves an exact balance', () => {
  expect(paymentAmounts(1001)).toEqual({ due: 300, balance: 701, percent: 30 });
  expect(paymentAmounts(0)).toEqual({ due: 0, balance: 0, percent: 30 });
  expect(paymentAmounts(1001, 'full')).toEqual({ due: 1001, balance: 0, percent: 100 });
});
test('rejects unsupported choices and invalid totals', () => {
  expect(() => paymentAmounts(1000, 'free')).toThrow('Choose');
  expect(() => paymentAmounts(-1)).toThrow('Invalid');
  expect(() => paymentAmounts(NaN)).toThrow('Invalid');
});
test.each(['advance', 'full'] as const)('server quote and stored booking agree for %s without marking money paid', option => {
  const db = seed();
  db.settings.minAdvance = 150;
  db.settings.maxAdvance = 150;
  const { quote, bookings } = planBooking(db, { turfId: db.turfs[0].id, date: '2099-01-01', hours: [12, 13], name: 'Payment test', phone: '9876500123', promoCode: null, addOns: [], useWallet: false, paymentOption: option }, null, false);
  const expected = option === 'full' ? quote.total : Math.round(quote.total * .3);
  expect(quote.payNow).toBe(expected);
  expect(quote.payAtVenue).toBe(quote.total - expected);
  expect(bookings[0].pricing.advance).toBe(expected);
  expect(bookings[0].amountPaid).toBe(0);
  expect(bookings[0].paymentMode).toBe('venue');
});
