'use server';

import { randomBytes } from 'node:crypto';
import { headers } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import { clerkEnabled } from './clerk';
import { ValidationError, refreshAll } from './action-utils';
import { rateLimit } from './rate-limit';
import { STEP_FIELDS, validateApplication, type ApplicationFields, type FieldErrors } from './validation/application';
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

async function clientIp() {
  return (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

// Throws a friendly error when one network or device is making requests too fast
async function throttle(action: string, perIp: number, holder?: string | null, perDevice?: number) {
  const ip = await clientIp();
  const ok = rateLimit(`${action}:ip:${ip}`, perIp, 10 * 60_000) && (!holder || !perDevice || rateLimit(`${action}:dev:${holder}`, perDevice, 10 * 60_000));
  if (!ok) throw new ValidationError('Too many attempts. Please wait a few minutes and try again.');
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
    await throttle('hold', 60, holder, 15);
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
      // Players reserve online and pay the turf at the venue; the turf collects the total at check-in
      paymentMode: 'venue',
      amountPaid: 0,
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
    await throttle('quote', 300);
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
    // With Clerk set up, only signed-in players can book
    if (clerkEnabled && !(await auth()).userId) throw new ValidationError('Please sign in to book');
    if (!String(req.name ?? '').trim()) throw new ValidationError('Enter your name');
    if (normalizePhone(String(req.phone ?? '')).length !== 10) throw new ValidationError('Enter a 10-digit mobile number');
    if (!checkDate(String(req.date))) throw new ValidationError('Pick a date within the next two weeks');
    const holder = await deviceHolder(true);
    await throttle('book', 30, holder, 10);

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

export interface ApplicationRequest extends ApplicationFields {
  sport: string;
  amenities: string[];
  /** Honeypot: hidden from people, bots fill it in */
  website?: string;
  /** When the form was first shown (ms since epoch), to catch instant bot submissions */
  startedAt?: number;
}

export async function submitApplication(req: ApplicationRequest): Promise<{ id?: string; error?: string; fieldErrors?: FieldErrors }> {
  const fake = () => ({ id: randomBytes(4).toString('hex').toUpperCase() });
  // Bots: pretend it worked so they don't adapt, but store nothing
  if (String(req.website ?? '').trim() !== '') return fake();
  const startedAt = Number(req.startedAt);
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 4000) return fake();

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`apply:${ip}`, 5, 60 * 60_000)) return { error: 'Too many applications from your network. Please try again in an hour.' };

  const s = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max);
  const fields = Object.fromEntries(
    (Object.keys(STEP_FIELDS) as unknown as number[]).flatMap((k) => STEP_FIELDS[k]).map((k) => [k, s(req[k], 1000)])
  ) as unknown as ApplicationFields;
  const fieldErrors = validateApplication(fields);
  if (Object.keys(fieldErrors).length > 0) return { error: Object.values(fieldErrors)[0], fieldErrors };

  const phone = normalizePhone(fields.ownerPhone);
  const email = fields.ownerEmail.toLowerCase();

  try {
    const id = await mutate((db) => {
      const duplicate = db.applications.find(
        (a) => a.status === 'pending' && (a.ownerPhone === phone || a.ownerEmail === email) && a.turfName.toLowerCase() === fields.turfName.toLowerCase()
      );
      if (duplicate) throw new ValidationError('We already have your application for this turf. Our team will contact you within 24–48 hours.');
      if (db.applications.filter((a) => a.status === 'pending' && a.ownerPhone === phone).length >= 3) {
        throw new ValidationError('You already have several applications waiting for review. We will contact you soon.');
      }
      const appId = newId('app');
      db.applications.push({
        id: appId,
        ownerName: s(fields.ownerName, 80),
        ownerPhone: phone,
        ownerEmail: email,
        turfName: s(fields.turfName, 80),
        area: s(fields.area, 60),
        address: s(fields.address, 300),
        sport: s(req.sport, 40) || 'Football',
        size: s(fields.size, 40),
        surface: s(fields.surface, 60),
        openTime: fields.openTime,
        closeTime: fields.closeTime,
        weekdayPrice: Math.round(Number(fields.weekdayPrice)),
        description: s(fields.description, 1000),
        whatsapp: normalizePhone(fields.whatsapp),
        amenities: (Array.isArray(req.amenities) ? req.amenities : []).map((a) => s(a, 40)).filter(Boolean).slice(0, 20),
        status: 'pending',
        note: [`Evening ₹${Math.round(Number(fields.eveningPrice))}/hr`, `Weekend ₹${Math.round(Number(fields.weekendPrice))}/hr`].join(' · '),
        turfId: null,
        createdAt: new Date().toISOString(),
        reviewedAt: null,
      });
      return appId;
    });
    refreshAll();
    return { id: id.slice(4, 12).toUpperCase() };
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    throw err;
  }
}
