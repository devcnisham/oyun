import { commissionFor } from './pricing';
import { addDays, weekStart } from './time';
import type { Booking, Database, Turf } from './types';

// Money the turf actually earns from a booking
export function bookingRevenue(b: Booking) {
  if (b.status === 'cancelled' || b.status === 'refunded') return 0;
  if (b.status === 'checked_in') return b.pricing.total; // balance collected at the venue
  return b.amountPaid; // confirmed (paid so far) or no-show (advance kept)
}

// Part of the revenue collected online by OYUN (walk-ins are paid to the turf directly)
export function onlineCollected(b: Booking) {
  if (b.source !== 'online' || b.status === 'cancelled' || b.status === 'refunded') return 0;
  return b.amountPaid;
}

export interface PayoutWeek {
  weekStart: string;
  weekEnd: string;
  bookings: number;
  gross: number;
  online: number;
  commission: number;
  commissionGst: number;
  payout: number;
  status: 'paid' | 'processing' | 'upcoming';
}

// Weekly settlements: Monday–Sunday, paid out the following Wednesday
export function payoutWeeks(db: Database, turf: Turf, today: string, weeks = 6): PayoutWeek[] {
  const rate = commissionFor(db, turf);
  const gstRate = db.settings.gstPercent;
  const currentWeek = weekStart(today);
  const result: PayoutWeek[] = [];

  for (let i = 0; i < weeks; i++) {
    const start = addDays(currentWeek, -7 * i);
    const end = addDays(start, 6);
    const list = db.bookings.filter((b) => b.turfId === turf.id && b.date >= start && b.date <= end);
    const gross = list.reduce((s, b) => s + bookingRevenue(b), 0);
    const online = list.reduce((s, b) => s + onlineCollected(b), 0);
    const commission = Math.round((online * rate) / 100);
    const commissionGst = Math.round((commission * gstRate) / 100);
    const payoutDate = addDays(end, 3);
    result.push({
      weekStart: start,
      weekEnd: end,
      bookings: list.filter((b) => bookingRevenue(b) > 0).length,
      gross,
      online,
      commission,
      commissionGst,
      payout: online - commission - commissionGst,
      status: i === 0 ? 'upcoming' : today >= payoutDate ? 'paid' : 'processing',
    });
  }
  return result;
}
