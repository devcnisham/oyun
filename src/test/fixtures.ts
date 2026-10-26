// Small, explicit test data built on the real seed so every field has a valid value.
import { seed } from '@/modules/shared/database/seed';
import type { Booking, Database, Player, Turf } from '@/modules/shared/database/types';
import type { IstNow } from '@/modules/shared/lib/time';

export const MONDAY = '2026-10-12';
export const SATURDAY = '2026-10-17';
// "Now" well before the test dates, so nothing is past and no last-minute discount applies
export const EARLY: IstNow = { date: '2026-10-01', hour: 9, minute: 0 };

export function makeDb(turf: Partial<Turf> = {}): { db: Database; turf: Turf } {
  const db = seed();
  const base = db.turfs[0];
  const t: Turf = {
    ...base,
    id: 'turf_test',
    name: 'Test Turf',
    pricePerHour: 1000,
    openTime: '06:00',
    closeTime: '23:00',
    halfPitch: false,
    commissionPercent: null,
    status: 'active',
    ...turf,
  };
  db.turfs = [t];
  db.pricing = {};
  db.offers = [];
  db.addOns = [];
  db.bookings = [];
  db.holds = [];
  db.blocks = [];
  db.players = [];
  db.walletTxns = [];
  db.promoCodes = [];
  return { db, turf: t };
}

let n = 0;
export function makeBooking(over: Partial<Booking> = {}): Booking {
  n += 1;
  return {
    id: `booking_${n}`,
    code: `SA-TEST${n}`,
    turfId: 'turf_test',
    date: MONDAY,
    hour: 18,
    timeLabel: '6 PM',
    customerName: 'Test Player',
    customerPhone: '9876543210',
    playerId: null,
    source: 'online',
    createdBy: null,
    addOns: [],
    pricing: { basePrice: 1000, adjustments: [], slotPrice: 1000, offer: null, promo: null, addOnTotal: 0, subtotal: 1000, walletDeduction: 0, total: 1000, advance: 150 },
    paymentMode: 'advance',
    amountPaid: 150,
    status: 'confirmed',
    checkedInAt: null,
    createdAt: new Date().toISOString(),
    ...over,
  };
}

export function makePlayer(over: Partial<Player> = {}): Player {
  n += 1;
  return {
    id: `player_${n}`,
    name: 'Asha',
    phone: '9876543210',
    walletBalance: 0,
    status: 'active',
    referralCode: `ASHA${n}`,
    referredBy: null,
    referralRewarded: false,
    createdAt: new Date().toISOString(),
    ...over,
  };
}
