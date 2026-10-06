'use server';

import { ValidationError, refreshAll } from './action-utils';
import { deviceHolder } from './device-holder';
import { buildQuote, getSlots, normalizePhone } from './pricing';
import { getDb, mutate, newBookingCode, newId } from './store';
import { addDays, formatHour, isValidDate, istNow } from './time';
import type { Booking, BookingAddOn, Database, PriceLine, Slot } from './types';
import { createPlayer, findByReferralCode, walletTxn } from './wallet';

const MAX_DAYS_AHEAD = 14;
const MAX_SLOTS = 6;
const HOLD_MINUTES = 8;

function checkDate(date: string) {
  const today = istNow().date;
  return isValidDate(date) && date >= today && date <= addDays(today, MAX_DAYS_AHEAD);
}

function bookableTurf(db: Database, turfId: string) {
  const turf = db.turfs.find((t) => t.id === turfId);
  return turf && turf.status === 'active' ? turf : null;
}

function purgeExpiredHolds(db: Database) {
  const nowIso = new Date().toISOString();
  db.holds = db.holds.filter((h) => h.expiresAt > nowIso);
}

function cleanHours(hours: unknown): number[] {
  if (!Array.isArray(hours)) throw new ValidationError('Pick at least one slot');
  const clean = [...new Set(hours.map(Number))].filter((h) => Number.isInteger(h) && h >= 0 && h <= 23).sort((a, b) => a - b);
  if (clean.length === 0) throw new ValidationError('Pick at least one slot');
  if (clean.length > MAX_SLOTS) throw new ValidationError(`You can book up to ${MAX_SLOTS} slots at a time`);
  return clean;
}

/* ---------- slots ---------- */

export async function getSlotsForDate(turfId: string, date: string): Promise<Slot[]> {
  const db = await getDb();
  const turf = bookableTurf(db, String(turfId));
  if (!turf || !checkDate(String(date))) return [];
  return getSlots(db, turf, date, istNow(), await deviceHolder(false));
}

export type HoldResult = { ok: true; expiresInMs: number; slots: Slot[] } | { ok: false; error: string; slots: Slot[] };

// Lock the chosen slots for this device while it checks out. Replaces any earlier hold.
export async function holdSlots(turfId: string, date: string, hours: number[]): Promise<HoldResult> {
  const holder = (await deviceHolder(true))!;
  try {
    if (!checkDate(String(date))) throw new ValidationError('Pick a date within the next two weeks');
    const wanted = cleanHours(hours);
    const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString();
    await mutate((db) => {
      const turf = bookableTurf(db, String(turfId));
      if (!turf) throw new ValidationError('This turf is not taking bookings right now');
      purgeExpiredHolds(db);
      db.holds = db.holds.filter((h) => h.holder !== holder);
      const slots = getSlots(db, turf, date, istNow(), holder);
      for (const hour of wanted) {
        const slot = slots.find((s) => s.hour === hour);
        if (!slot?.available) {
          const what = slot?.reason === 'held' ? 'is being booked by someone else right now' : 'was just taken';
          throw new ValidationError(`${slot?.label ?? formatHour(hour)} ${what}. Please pick another slot.`);
        }
        db.holds.push({ id: newId('hold'), turfId: turf.id, date, hour, holder, expiresAt });
      }
    });
    return { ok: true, expiresInMs: HOLD_MINUTES * 60_000, slots: await getSlotsForDate(turfId, date) };
  } catch (err) {
    if (!(err instanceof ValidationError)) throw err;
    return { ok: false, error: err.message, slots: await getSlotsForDate(turfId, date) };
  }
}

export async function releaseHolds(): Promise<void> {
  const holder = await deviceHolder(false);
  if (!holder) return;
  await mutate((db) => {
    db.holds = db.holds.filter((h) => h.holder !== holder);
  });
}

/* ---------- referral ---------- */

export type ReferralCheck = { status: 'valid'; referrerName: string; reward: number } | { status: 'invalid' | 'not_new' | 'disabled' };

// Referral codes only count for a phone number's first booking
export async function checkReferralCode(code: string, phone: string): Promise<ReferralCheck> {
  const db = await getDb();
  if (!db.settings.referralEnabled) return { status: 'disabled' };
  const referrer = findByReferralCode(db, code);
  if (!referrer || referrer.status !== 'active') return { status: 'invalid' };
  const p = normalizePhone(phone);
  if (p.length === 10 && (db.players.some((x) => x.phone === p) || referrer.phone === p)) return { status: 'not_new' };
  return { status: 'valid', referrerName: referrer.name.split(' ')[0], reward: db.settings.refereeReward };
}

/* ---------- quote and booking ---------- */

export interface SelectionRequest {
  turfId: string;
  date: string;
  hours: number[];
  promoCode: string | null;
  addOns: { id: string; qty: number }[];
  useWallet: boolean;
  phone: string;
  paymentMode: 'full' | 'advance';
}

export interface BookingRequest extends SelectionRequest {
  name: string;
  referralCode?: string | null;
}

export interface SelectionQuote {
  slots: { hour: number; label: string; price: number }[];
  slotTotal: number; // slot prices after peak/weekend/last-minute pricing
  adjustments: PriceLine[]; // owner offers and promo, summed across slots
  addOns: BookingAddOn[];
  addOnTotal: number;
  walletBalance: number;
  walletDeduction: number;
  total: number;
  payNow: number;
  payAtVenue: number;
  promoCode: string | null;
  promoError: string | null;
  slotError: string | null;
}

/*
 * Books every chosen hour against `db` and returns the bookings plus the price summary.
 * The quote runs this on a throwaway copy, so the price shown is exactly what booking charges.
 * Add-ons are attached to the first hour only.
 */
function planBooking(db: Database, req: BookingRequest, holder: string | null, strict: boolean) {
  const turf = bookableTurf(db, req.turfId);
  if (!turf) throw new ValidationError('This turf is not taking bookings right now');
  const hours = cleanHours(req.hours);
  const phone = normalizePhone(req.phone);
  const name = req.name.trim().slice(0, 80) || 'Player';
  const now = istNow();
  const paymentMode = req.paymentMode === 'advance' ? 'advance' : 'full';

  let player = phone.length === 10 ? db.players.find((p) => p.phone === phone) : undefined;
  if (player?.status === 'banned') throw new ValidationError('This number cannot make bookings. Contact support.');
  const walletBalance = player && player.status === 'active' ? player.walletBalance : 0;
  if (!player) {
    const referrer = db.settings.referralEnabled ? findByReferralCode(db, req.referralCode) : undefined;
    if (strict && req.referralCode?.trim() && !referrer) throw new ValidationError('That referral code is not valid');
    player = createPlayer(db, name, phone || '0000000000', referrer && referrer.status === 'active' ? referrer.id : null);
  }

  const bookings: Booking[] = [];
  const adjustments = new Map<string, number>();
  const addAdjustment = (line: PriceLine | null) => line && adjustments.set(line.label, (adjustments.get(line.label) ?? 0) + line.amount);
  let promoError: string | null = null;
  let promoCode: string | null = null;
  let slotError: string | null = null;
  let addOns: BookingAddOn[] = [];

  hours.forEach((hour, i) => {
    const quote = buildQuote(
      db,
      { turfId: turf.id, date: req.date, hour, promoCode: req.promoCode, addOns: i === 0 ? req.addOns : [], useWallet: req.useWallet, phone, source: 'online', holder },
      now
    );
    if (!quote) throw new ValidationError('Turf not found');
    slotError ??= quote.slotError;
    promoError ??= quote.promoError;
    promoCode ??= quote.promoCode;
    if (i === 0) addOns = quote.addOns;
    addAdjustment(quote.breakdown.offer);
    addAdjustment(quote.breakdown.promo);
    if (quote.promoCode) {
      const promo = db.promoCodes.find((p) => p.code === quote.promoCode);
      if (promo) promo.uses += 1;
    }

    const booking: Booking = {
      id: newId('bk'),
      code: newBookingCode(db),
      turfId: turf.id,
      date: req.date,
      hour,
      timeLabel: formatHour(hour),
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
    // Deducting as we go means the next hour's quote sees the remaining balance
    walletTxn(db, player, -quote.breakdown.walletDeduction, 'booking_payment', `Booking ${booking.code}`, booking.id);
    bookings.push(booking);
  });

  const sum = (f: (b: Booking) => number) => bookings.reduce((s, b) => s + f(b), 0);
  const total = sum((b) => b.pricing.total);
  const payNow = sum((b) => b.amountPaid);
  const quote: SelectionQuote = {
    slots: bookings.map((b) => ({ hour: b.hour, label: b.timeLabel, price: b.pricing.slotPrice })),
    slotTotal: sum((b) => b.pricing.slotPrice),
    adjustments: [...adjustments].map(([label, amount]) => ({ label, amount })),
    addOns,
    addOnTotal: sum((b) => b.pricing.addOnTotal),
    walletBalance,
    walletDeduction: sum((b) => b.pricing.walletDeduction),
    total,
    payNow,
    payAtVenue: total - payNow,
    promoCode,
    promoError: req.promoCode ? promoError : null,
    slotError,
  };
  return { bookings, quote };
}

export async function quoteSelection(req: SelectionRequest): Promise<SelectionQuote | { error: string }> {
  try {
    if (!checkDate(String(req.date))) throw new ValidationError('Pick a date within the next two weeks');
    const db = await getDb();
    const holder = await deviceHolder(false);
    return planBooking(structuredClone(db), { ...req, name: 'Player' }, holder, false).quote;
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    throw err;
  }
}

export async function createBookings(req: BookingRequest): Promise<{ ids?: string[]; error?: string }> {
  try {
    if (!String(req.name ?? '').trim()) throw new ValidationError('Enter your name');
    if (normalizePhone(String(req.phone ?? '')).length !== 10) throw new ValidationError('Enter a 10-digit mobile number');
    if (!checkDate(String(req.date))) throw new ValidationError('Pick a date within the next two weeks');
    const holder = await deviceHolder(true);

    const ids = await mutate((db) => {
      purgeExpiredHolds(db);
      const { bookings, quote } = planBooking(db, req, holder, true);
      if (quote.slotError) throw new ValidationError(quote.slotError);
      if (quote.promoError) throw new ValidationError(quote.promoError);
      db.holds = db.holds.filter((h) => h.holder !== holder);
      return bookings.map((b) => b.id);
    });

    refreshAll();
    return { ids };
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    throw err;
  }
}

/* ---------- booking lookup for "My bookings" (ids are unguessable, kept on the device) ---------- */

export interface BookingSummary {
  id: string;
  code: string;
  turfId: string;
  turfName: string;
  area: string;
  image: string;
  date: string;
  hour: number;
  timeLabel: string;
  status: Booking['status'];
  total: number;
  due: number;
}

export async function getBookingSummaries(ids: string[]): Promise<BookingSummary[]> {
  if (!Array.isArray(ids)) return [];
  const wanted = new Set(ids.map(String).filter((id) => /^bk_[a-f0-9]{12}$/.test(id)).slice(0, 100));
  if (wanted.size === 0) return [];
  const db = await getDb();
  return db.bookings
    .filter((b) => wanted.has(b.id))
    .map((b) => {
      const turf = db.turfs.find((t) => t.id === b.turfId);
      return {
        id: b.id,
        code: b.code,
        turfId: b.turfId,
        turfName: turf?.name ?? 'Turf',
        area: turf?.area ?? '',
        image: turf?.images[0] ?? '/turfs/turf_0.jpg',
        date: b.date,
        hour: b.hour,
        timeLabel: b.timeLabel,
        status: b.status,
        total: b.pricing.total,
        due: b.pricing.total - b.amountPaid,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);
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

  const id = await mutate((db) => {
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
