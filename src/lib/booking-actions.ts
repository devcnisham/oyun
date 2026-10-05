'use server';

import { ValidationError, refreshAll } from './action-utils';
import { buildQuote, getSlots, normalizePhone, type Quote } from './pricing';
import { getDb, mutate, newBookingCode, newId } from './store';
import { addDays, formatHour, isValidDate, istNow } from './time';
import type { Booking, Slot } from './types';
import { createPlayer, findByReferralCode, walletTxn } from './wallet';

const MAX_DAYS_AHEAD = 14;

function checkDate(date: string) {
  const today = istNow().date;
  return isValidDate(date) && date >= today && date <= addDays(today, MAX_DAYS_AHEAD);
}

function bookableTurf(turfId: string) {
  const turf = getDb().turfs.find((t) => t.id === turfId);
  return turf && turf.status === 'active' ? turf : null;
}

export async function getSlotsForDate(turfId: string, date: string): Promise<Slot[]> {
  const turf = bookableTurf(turfId);
  if (!turf || !checkDate(date)) return [];
  return getSlots(getDb(), turf, date, istNow());
}

export interface QuoteRequest {
  turfId: string;
  date: string;
  hour: number;
  promoCode: string | null;
  addOns: { id: string; qty: number }[];
  useWallet: boolean;
  phone: string;
}

export type PublicQuote = Quote;

export type ReferralCheck = { status: 'valid'; referrerName: string; reward: number } | { status: 'invalid' | 'not_new' | 'disabled' };

// Referral codes only count for a phone number's first booking
export async function checkReferralCode(code: string, phone: string): Promise<ReferralCheck> {
  const db = getDb();
  if (!db.settings.referralEnabled) return { status: 'disabled' };
  const referrer = findByReferralCode(db, code);
  if (!referrer || referrer.status !== 'active') return { status: 'invalid' };
  const p = normalizePhone(phone);
  if (p.length === 10 && (db.players.some((x) => x.phone === p) || referrer.phone === p)) return { status: 'not_new' };
  return { status: 'valid', referrerName: referrer.name.split(' ')[0], reward: db.settings.refereeReward };
}

export async function getBookingQuote(req: QuoteRequest): Promise<PublicQuote | null> {
  if (!bookableTurf(req.turfId) || !checkDate(req.date)) return null;
  return buildQuote(getDb(), { ...req, source: 'online' }, istNow());
}

export interface BookingRequest extends QuoteRequest {
  name: string;
  paymentMode: 'full' | 'advance';
  referralCode?: string | null;
}

export async function createBooking(req: BookingRequest): Promise<{ id?: string; error?: string }> {
  try {
    const name = req.name.trim().slice(0, 80);
    const phone = normalizePhone(req.phone);
    if (!name) throw new ValidationError('Enter your name');
    if (phone.length !== 10) throw new ValidationError('Enter a 10-digit mobile number');
    if (!bookableTurf(req.turfId)) throw new ValidationError('This turf is not taking bookings right now');
    if (!checkDate(req.date)) throw new ValidationError('Pick a date within the next two weeks');

    const id = mutate((db) => {
      const quote = buildQuote(db, { ...req, phone, source: 'online' }, istNow());
      if (!quote) throw new ValidationError('Turf not found');
      if (quote.slotError) throw new ValidationError(quote.slotError);
      if (req.promoCode && quote.promoError) throw new ValidationError(quote.promoError);

      let player = db.players.find((p) => p.phone === phone);
      if (player?.status === 'banned') throw new ValidationError('This number cannot make bookings. Contact support.');
      if (!player) {
        const referrer = db.settings.referralEnabled ? findByReferralCode(db, req.referralCode) : undefined;
        if (req.referralCode?.trim() && !referrer) throw new ValidationError('That referral code is not valid');
        player = createPlayer(db, name, phone, referrer && referrer.status === 'active' ? referrer.id : null);
      }
      if (quote.promoCode) {
        const promo = db.promoCodes.find((p) => p.code === quote.promoCode);
        if (promo) promo.uses += 1;
      }

      const paymentMode = req.paymentMode === 'advance' ? 'advance' : 'full';
      const booking: Booking = {
        id: newId('bk'),
        code: newBookingCode(db),
        turfId: req.turfId,
        date: req.date,
        hour: req.hour,
        timeLabel: formatHour(req.hour),
        customerName: name,
        customerPhone: phone,
        playerId: player.id,
        source: 'online',
        createdBy: null,
        addOns: quote.addOns,
        pricing: quote.breakdown,
        paymentMode,
        // Payment gateway comes later (FEATURE_LIST section 3); treat as paid for the demo
        amountPaid: paymentMode === 'advance' ? quote.breakdown.advance : quote.breakdown.total,
        status: 'confirmed',
        checkedInAt: null,
        createdAt: new Date().toISOString(),
      };
      db.bookings.push(booking);
      walletTxn(db, player, -quote.breakdown.walletDeduction, 'booking_payment', `Booking ${booking.code}`, booking.id);
      return booking.id;
    });

    refreshAll();
    return { id };
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    throw err;
  }
}

export interface ApplicationRequest {
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  turfName: string;
  area: string;
  address: string;
  sport: string;
  size: string;
  surface: string;
  openTime: string;
  closeTime: string;
  weekdayPrice: string;
  description: string;
  whatsapp: string;
  amenities: string[];
}

export async function submitApplication(req: ApplicationRequest): Promise<{ id?: string; error?: string }> {
  const s = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max);
  const phone = normalizePhone(s(req.ownerPhone));
  const email = s(req.ownerEmail).toLowerCase();
  const price = Number(req.weekdayPrice);
  if (!s(req.ownerName) || !s(req.turfName) || !s(req.area) || !s(req.address)) return { error: 'Please fill in all required fields' };
  if (phone.length !== 10) return { error: 'Enter a 10-digit phone number' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address' };
  if (!Number.isFinite(price) || price < 100) return { error: 'Enter a weekday price of at least ₹100' };

  const id = mutate((db) => {
    const appId = newId('app');
    db.applications.push({
      id: appId,
      ownerName: s(req.ownerName, 80),
      ownerPhone: phone,
      ownerEmail: email,
      turfName: s(req.turfName, 80),
      area: s(req.area, 60),
      address: s(req.address, 300),
      sport: s(req.sport, 40) || 'Football',
      size: s(req.size, 40) || '5-a-side',
      surface: s(req.surface, 60) || 'Artificial Grass',
      openTime: /^\d{2}:\d{2}$/.test(req.openTime) ? req.openTime : '06:00',
      closeTime: /^\d{2}:\d{2}$/.test(req.closeTime) ? req.closeTime : '22:00',
      weekdayPrice: Math.round(price),
      description: s(req.description, 1000),
      whatsapp: s(req.whatsapp, 20),
      amenities: (req.amenities ?? []).map((a) => s(a, 40)).slice(0, 20),
      status: 'pending',
      note: '',
      turfId: null,
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    });
    return appId;
  });
  refreshAll();
  return { id: id.slice(4, 12).toUpperCase() };
}
