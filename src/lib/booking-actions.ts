'use server';

import { BOOKINGS_NOT_SAVED_MESSAGE, bookingsAreSaved } from './booking-availability';
import { randomBytes } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { ATTRIBUTION_COOKIE, decodeAttribution } from './attribution';
import { auth } from '@clerk/nextjs/server';
import { CANCEL_CUTOFF_HOURS, canSelfCancel } from './cancel-policy';
import { isRainDisruption } from './rain';
import { REVIEW_MAX_LENGTH, publicName, recomputeTurfRating } from './reviews';
import { clerkEnabled } from './clerk';
import { ValidationError, refreshAll } from './action-utils';
import { sharedRateLimit } from './shared-rate-limit';
import { STEP_FIELDS, validateApplication, type ApplicationFields, type FieldErrors } from './validation/application';
import { deviceHolder } from './device-holder';
import { freePart, getSlots, normalizePhone, turfHours } from './pricing';
import { bookableTurf, planBooking } from './booking-plan';
import { cleanHours, cleanSide, cleanSize, type BookingRequest, type SelectionQuote, type SelectionRequest } from './booking-types';
import { getDb, mutate, newId, storageInfo } from './store';
import { BOOKING_DAYS, addDays, formatHour, formatSlotRange, isValidDate, istNow, parseHour, slotTimestamp } from './time';
import type { Booking, Database, HalfNames, PitchPart, PitchSide, PitchSize, Slot } from './types';
import { findByReferralCode, refundDue, walletTxn } from './wallet';
import { notifyWaitlistWhenSlotFreed } from './waitlist';
import { sendBookingConfirmation, sendOwnerAlert } from './notifications';
import { clientIpFrom } from '@/lib/client-ip';

const MAX_DAYS_AHEAD = BOOKING_DAYS - 1;
const HOLD_MINUTES = 8;
const SLOTS_UNAVAILABLE_MESSAGE = 'Booking is not available for this turf right now. Please try again later.';

function checkDate(date: string) {
  const today = istNow().date;
  return isValidDate(date) && date >= today && date <= addDays(today, MAX_DAYS_AHEAD);
}

async function clientIp() {
  try {
    return clientIpFrom(await headers());
  } catch {
    return '127.0.0.1';
  }
}

// Throws a friendly error when one network or device is making requests too fast
async function throttle(action: string, perIp: number, holder?: string | null, perDevice?: number) {
  const ip = await clientIp();
  const ok = (await sharedRateLimit(`${action}:ip:${ip}`, perIp, 10 * 60_000)) && (!holder || !perDevice || (await sharedRateLimit(`${action}:dev:${holder}`, perDevice, 10 * 60_000)));
  if (!ok) throw new ValidationError('Too many attempts. Please wait a few minutes and try again.');
}

// Refuse new holds and bookings while the data would not be kept (see booking-availability.ts)
function assertBookingsAreSaved() {
  if (!bookingsAreSaved({ shared: storageInfo().shared, allowEphemeral: process.env.ALLOW_EPHEMERAL_BOOKINGS === 'true' })) {
    throw new ValidationError(BOOKINGS_NOT_SAVED_MESSAGE);
  }
}

function purgeExpiredHolds(db: Database) {
  const nowIso = new Date().toISOString();
  db.holds = db.holds.filter((h) => h.expiresAt > nowIso);
}

import {
  isV2SlotsActive,
  v2GetSlotsForDate,
  v2HoldSlots,
  v2ReleaseHolds,
  v2MoveBooking,
} from './v2-slots';
import { v2Checkout } from './v2-checkout';

/* ---------- slots ---------- */

export async function getSlotsForDate(turfId: string, date: string, size: PitchSize = 'full', side?: PitchSide): Promise<Slot[]> {
  const db = await getDb();
  const turf = bookableTurf(db, String(turfId));
  if (!turf || !checkDate(String(date))) return [];
  const holder = await deviceHolder(false);
  if (isV2SlotsActive()) {
    const v2Slots = await v2GetSlotsForDate(String(turfId), String(date), cleanSize(size), undefined, holder);
    if (v2Slots) return v2Slots;
  }
  return getSlots(db, turf, date, istNow(), holder, false, cleanSize(size), cleanSide(side));
}

export type HoldResult = { ok: true; expiresInMs: number; slots: Slot[] } | { ok: false; error: string; slots: Slot[] };

// Lock the chosen slots for this device while it checks out. Replaces any earlier hold.
export async function holdSlots(turfId: string, date: string, hours: number[], size: PitchSize = 'full', side?: PitchSide): Promise<HoldResult> {
  const holder = (await deviceHolder(true))!;
  const pitchSize = cleanSize(size);
  const pitchSide = pitchSize === 'half' ? cleanSide(side) : undefined;
  try {
    assertBookingsAreSaved();
    await throttle('hold', 60, holder, 15);
    if (!checkDate(String(date))) throw new ValidationError('Pick a date within the next week');
    const wanted = cleanHours(hours);

    if (isV2SlotsActive()) {
      const v2Res = await v2HoldSlots(turfId, date, wanted, holder, pitchSize);
      if (v2Res) {
        if (!v2Res.ok) {
          return { ok: false, error: v2Res.error, slots: await getSlotsForDate(turfId, date, pitchSize, pitchSide) };
        }
        return { ok: true, expiresInMs: v2Res.expiresInMs, slots: await getSlotsForDate(turfId, date, pitchSize, pitchSide) };
      }
      // The turf has no relational slot setup. A hold saved through `mutate` would be dropped (R008), so refuse it.
      return { ok: false, error: SLOTS_UNAVAILABLE_MESSAGE, slots: await getSlotsForDate(turfId, date, pitchSize, pitchSide) };
    }

    const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString();
    await mutate((db) => {
      const turf = bookableTurf(db, String(turfId));
      if (!turf) throw new ValidationError('This turf is not taking bookings right now');
      purgeExpiredHolds(db);
      db.holds = db.holds.filter((h) => h.holder !== holder);
      const slots = getSlots(db, turf, date, istNow(), holder, false, pitchSize, pitchSide);
      for (const hour of wanted) {
        const slot = slots.find((s) => s.hour === hour);
        const pitch = slot?.available ? freePart(db, turf, date, hour, pitchSize, holder, pitchSide) : null;
        if (!slot?.available || !pitch) {
          const what = slot?.reason === 'held' ? 'is being booked by someone else right now' : 'was just taken';
          throw new ValidationError(`${slot?.label ?? formatHour(hour)} ${what}. Please pick another slot.`);
        }
        // Holding a half claims a specific half (A or B), so the booking lands on the same one
        db.holds.push({ id: newId('hold'), turfId: turf.id, date, hour, holder, pitch, expiresAt });
      }
    });
    return { ok: true, expiresInMs: HOLD_MINUTES * 60_000, slots: await getSlotsForDate(turfId, date, pitchSize, pitchSide) };
  } catch (err) {
    if (err instanceof ValidationError) return { ok: false, error: err.message, slots: await getSlotsForDate(turfId, date, pitchSize, pitchSide) };
    console.error('[booking] holdSlots error:', err);
    return { ok: false, error: 'Could not hold slots. Please try again in a moment.', slots: [] };
  }
}

export async function releaseHolds(): Promise<void> {
  const holder = await deviceHolder(false);
  if (!holder) return;
  if (isV2SlotsActive()) {
    await v2ReleaseHolds(holder);
    return;
  }
  try {
    await mutate((db) => {
      db.holds = db.holds.filter((h) => h.holder !== holder);
    });
  } catch (err) {
    console.warn('[booking] releaseHolds failed:', err);
  }
}

/* ---------- referral ---------- */

export type ReferralCheck = { status: 'valid'; referrerName: string; reward: number } | { status: 'invalid' | 'not_new' | 'disabled' };

// Referral codes only count for a phone number's first booking
export async function checkReferralCode(code: string, phone: string): Promise<ReferralCheck> {
  // The answer tells apart "valid" from "not new" (that phone already has a player), so it must not be guessable in bulk
  try {
    await throttle('referral', 40);
  } catch (err) {
    if (err instanceof ValidationError) return { status: 'invalid' };
    throw err;
  }
  const db = await getDb();
  if (!db.settings.referralEnabled) return { status: 'disabled' };
  const referrer = findByReferralCode(db, code);
  if (!referrer || referrer.status !== 'active') return { status: 'invalid' };
  const p = normalizePhone(phone);
  if (p.length === 10 && (db.players.some((x) => x.phone === p) || referrer.phone === p)) return { status: 'not_new' };
  return { status: 'valid', referrerName: referrer.name.split(' ')[0], reward: db.settings.refereeReward };
}

/* ---------- quote and booking ---------- */

export async function quoteSelection(req: SelectionRequest): Promise<SelectionQuote | { error: string }> {
  try {
    if (!checkDate(String(req.date))) throw new ValidationError('Pick a date within the next week');
    await throttle('quote', 300);
    const db = await getDb();
    const holder = await deviceHolder(false);
    const accountId = await currentAccountId();
    return planBooking(structuredClone(db), { ...req, name: 'Player' }, holder, false, accountId).quote;
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    console.error('[booking] quoteSelection error:', err);
    return { error: 'Could not calculate quote. Please try again in a moment.' };
  }
}

export async function createBookings(req: BookingRequest): Promise<{ ids?: string[]; error?: string }> {
  try {
    assertBookingsAreSaved();
    // With Clerk set up, only signed-in players can book, and the booking is saved to their account
    const accountId = await currentAccountId();
    if (clerkEnabled && !accountId) throw new ValidationError('Please sign in to book');
    if (!String(req.name ?? '').trim()) throw new ValidationError('Enter your name');
    if (normalizePhone(String(req.phone ?? '')).length !== 10) throw new ValidationError('Enter a 10-digit mobile number');
    if (!checkDate(String(req.date))) throw new ValidationError('Pick a date within the next week');
    const holder = await deviceHolder(true);
    await throttle('book', 30, holder, 10);

    if (isV2SlotsActive()) {
      const { ids } = await v2Checkout(req, holder, accountId);
      refreshAll();
      return { ids };
    }

    // Where the player first came from (saved on the booking for the legacy store; the v2 relational path does not store it yet)
    const acquisition = decodeAttribution((await cookies()).get(ATTRIBUTION_COOKIE)?.value);
    const ids = await mutate((db) => {
      purgeExpiredHolds(db);
      const { bookings, quote } = planBooking(db, req, holder, true, accountId);
      if (quote.slotError) throw new ValidationError(quote.slotError);
      if (quote.promoError) throw new ValidationError(quote.promoError);
      db.holds = db.holds.filter((h) => h.holder !== holder);
      for (const b of bookings) {
        b.accountId = accountId;
        b.acquisition = acquisition;
      }
      return bookings.map((b) => b.id);
    });

    refreshAll();
    try {
      const db = await getDb();
      const turf = db.turfs.find((t) => t.id === req.turfId);
      const booking = db.bookings.find((b) => ids?.includes(b.id));
      if (turf && booking) {
        sendBookingConfirmation(booking, turf).catch(() => {});
        sendOwnerAlert(booking, turf, 'new_booking').catch(() => {});
      }
    } catch {}
    return { ids };
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    console.error('[booking] createBookings error:', err);
    return { error: 'Could not complete the booking. Please try again in a moment.' };
  }
}

/* ---------- player self-cancel ---------- */

// Who may act on a ticket: bookings made while signed in only from that same account; anonymous bookings need the
// mobile number typed at booking time on top of the unguessable id, so a leaked ticket link alone is not enough
function proveBookingOwner(booking: Booking, accountId: string | null, phone: string | undefined, verb: string): void {
  if (booking.accountId) {
    if (booking.accountId !== accountId) throw new ValidationError(`Sign in with the account that made this booking to ${verb} it`);
    return;
  }
  const typed = normalizePhone(String(phone ?? ''));
  if (typed.length !== 10 || typed !== normalizePhone(booking.customerPhone)) {
    throw new ValidationError(`Enter the mobile number used for this booking to ${verb} it`);
  }
}

// A player cancels their own upcoming booking. The booking id (unguessable, on their ticket) proves they have the
// ticket; the account (or, for anonymous bookings, the booking phone number) proves they made it. The slot opens up live for others.
export async function cancelMyBooking(bookingId: string, phone?: string): Promise<{ ok: true } | { error: string }> {
  try {
    const id = String(bookingId);
    if (!/^bk_[a-f0-9]{12}$/.test(id)) throw new ValidationError('Booking not found');
    await throttle('cancel', 20);
    const accountId = await currentAccountId();
    await mutate((db) => {
      const booking = db.bookings.find((b) => b.id === id);
      if (!booking) throw new ValidationError('Booking not found');
      proveBookingOwner(booking, accountId, phone, 'cancel');
      if (booking.status !== 'confirmed') throw new ValidationError('This booking can no longer be cancelled');
      // Rain is decided here from the stored turf and date, never from anything the client sends
      const rain = isRainDisruption(db.turfs.find((t) => t.id === booking.turfId), booking.date, db);
      if (!canSelfCancel(booking, rain)) {
        throw new ValidationError(`Bookings can be cancelled up to ${CANCEL_CUTOFF_HOURS} hours before the slot. Please call the turf.`);
      }
      booking.cancelledAt = new Date().toISOString();
      if (rain) booking.cancelReason = 'rain';
      // Everything actually paid (wallet credit used, plus anything paid online) goes back to the wallet, in full.
      // refundDue already counts all of it, so the rain case is the same amount, just allowed past the cutoff.
      const refund = refundDue(booking);
      if (refund > 0 && booking.playerId) {
        const player = db.players.find((pl) => pl.id === booking.playerId);
        const note = rain ? `Booking ${booking.code} cancelled: rain policy, full refund` : `Booking ${booking.code} cancelled`;
        if (player) walletTxn(db, player, refund, 'refund', note, booking.id);
        booking.status = 'refunded';
      } else {
        booking.status = 'cancelled';
      }
      const hoursFreed = booking.hours && booking.hours.length > 0 ? booking.hours : [booking.hour];
      for (const h of hoursFreed) {
        notifyWaitlistWhenSlotFreed(db, booking.turfId, booking.date, h);
      }
      const turf = db.turfs.find((t) => t.id === booking.turfId);
      if (turf) {
        sendOwnerAlert(booking, turf, 'cancellation').catch(() => {});
      }
    });
    // With v2 slots the status change above is written back to oyun, which frees the slots
    refreshAll();
    return { ok: true };
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    console.error('[booking] cancelMyBooking error:', err);
    return { error: 'Could not cancel booking. Please try again in a moment.' };
  }
}

// A player moves an upcoming confirmed booking to another slot at the same turf.
// Verified via booking ID, ownership check, rate limit, 2-hour cutoff rule, operating hours and collision checks.
export async function rescheduleBooking(
  bookingId: string,
  newDate: string,
  newHour: number,
  phone?: string
): Promise<{ ok: true } | { error: string }> {
  try {
    const id = String(bookingId);
    if (!/^bk_[a-f0-9]{12}$/.test(id)) throw new ValidationError('Booking not found');
    await throttle('reschedule', 20);

    const dateStr = String(newDate || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new ValidationError('Invalid date');
    const hourNum = Number(newHour);
    if (!Number.isInteger(hourNum) || hourNum < 0 || hourNum > 23) {
      throw new ValidationError('Invalid hour');
    }

    const slotStart = new Date(`${dateStr}T${String(hourNum).padStart(2, '0')}:00:00+05:30`).getTime();
    if (slotStart <= Date.now()) {
      throw new ValidationError('Please choose an upcoming slot in the future');
    }

    const accountId = await currentAccountId();

    // The checks both paths share: who owns it, whether it can still move, and the new slot's hours and pitch
    const check = (db: Database) => {
      const booking = db.bookings.find((b) => b.id === id);
      if (!booking) throw new ValidationError('Booking not found');
      proveBookingOwner(booking, accountId, phone, 'reschedule');
      if (booking.status !== 'confirmed') {
        throw new ValidationError('Only confirmed bookings can be rescheduled');
      }
      const rain = isRainDisruption(db.turfs.find((t) => t.id === booking.turfId), booking.date, db);
      if (!canSelfCancel(booking, rain)) {
        throw new ValidationError(`Bookings can be rescheduled up to ${CANCEL_CUTOFF_HOURS} hours before the slot. Please call the turf.`);
      }

      const turf = db.turfs.find((t) => t.id === booking.turfId);
      if (!turf) throw new ValidationError('Turf not found');
      if (!turfHours(turf).includes(hourNum)) {
        throw new ValidationError('Selected time is outside turf operating hours');
      }

      const neededSize: PitchSize = booking.pitch === 'A' || booking.pitch === 'B' ? 'half' : 'full';
      const allocatedPitch = freePart(db, turf, dateStr, hourNum, neededSize, null);
      if (!allocatedPitch) {
        throw new ValidationError('Selected slot is not available. Please choose another time.');
      }
      return { booking, turf, allocatedPitch };
    };
    const record = (booking: Booking, allocatedPitch: PitchPart, original: { date: string; hour: number }) => {
      booking.originalSlot = booking.originalSlot || original;
      booking.date = dateStr;
      booking.hour = hourNum;
      booking.pitch = allocatedPitch;
      booking.timeLabel = formatSlotRange(hourNum, booking.durationMinutes ?? 60, booking.startMinute ?? 0);
      booking.rescheduledAt = new Date().toISOString();
    };

    if (isV2SlotsActive()) {
      // The slot claims move first (atomic: a taken slot leaves the booking where it was), then the record follows
      const { booking, turf } = check(await getDb());
      const original = { date: booking.date, hour: booking.hour };
      const moved = await v2MoveBooking(id, slotTimestamp(dateStr, hourNum, parseHour(turf.openTime), booking.startMinute ?? 0), booking.turfId, [booking.date, dateStr]);
      if (!moved) throw new Error('[reschedule] could not reach the booking service');
      if (!moved.ok) throw new ValidationError(moved.error);
      await mutate((db) => {
        const b = db.bookings.find((x) => x.id === id);
        if (b) record(b, b.pitch ?? 'full', original);
      });
    } else {
      await mutate((db) => {
        const { booking, allocatedPitch } = check(db);
        record(booking, allocatedPitch, { date: booking.date, hour: booking.hour });
      });
    }

    refreshAll();
    return { ok: true };
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    console.error('[booking] rescheduleBooking error:', err);
    return { error: 'Could not reschedule booking. Please try again in a moment.' };
  }
}

/* ---------- ratings & reviews ---------- */

// After playing (checked in), the player rates the turf. One review per booking; sending again updates it.
export async function submitReview(bookingId: string, rating: number, comment: string, phone?: string): Promise<{ ok: true } | { error: string }> {
  try {
    const id = String(bookingId);
    if (!/^bk_[a-f0-9]{12}$/.test(id)) throw new ValidationError('Booking not found');
    const stars = Math.round(Number(rating));
    if (!(stars >= 1 && stars <= 5)) throw new ValidationError('Pick 1 to 5 stars');
    const text = String(comment ?? '').replace(/\s+/g, ' ').trim().slice(0, REVIEW_MAX_LENGTH);
    await throttle('review', 20);
    const accountId = await currentAccountId();
    await mutate((db) => {
      const booking = db.bookings.find((b) => b.id === id);
      if (!booking) throw new ValidationError('Booking not found');
      proveBookingOwner(booking, accountId, phone, 'review');
      if (booking.status !== 'checked_in') throw new ValidationError('You can rate the turf after you have played');
      booking.review = {
        rating: stars,
        comment: text,
        name: publicName(booking.customerName),
        createdAt: new Date().toISOString(),
        hidden: booking.review?.hidden ?? false,
      };
      recomputeTurfRating(db, booking.turfId);
    });
    refreshAll();
    return { ok: true };
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    console.error('[booking] submitReview error:', err);
    return { error: 'Could not submit review. Please try again in a moment.' };
  }
}

/* ---------- booking lookup for "My bookings" ---------- */

// The signed-in Clerk player, if any
async function currentAccountId(): Promise<string | null> {
  if (!clerkEnabled) return null;
  try {
    return (await auth()).userId ?? null;
  } catch {
    return null;
  }
}

export interface BookingSummary {
  halfNames?: HalfNames; // the turf's names for its halves, if it has them
  id: string;
  code: string;
  turfId: string;
  turfName: string;
  area: string;
  image: string;
  date: string;
  hour: number;
  timeLabel: string;
  pitch?: Booking['pitch'];
  status: Booking['status'];
  total: number;
  due: number;
  reviewed: boolean;
}

// Bookings saved on this device (their ids are unguessable) plus, when signed in, every booking on the
// player's account, so they show up on any phone or computer
export async function getBookingSummaries(ids: string[]): Promise<BookingSummary[]> {
  const wanted = new Set((Array.isArray(ids) ? ids : []).map(String).filter((id) => /^bk_[a-f0-9]{12}$/.test(id)).slice(0, 100));
  const accountId = await currentAccountId();
  if (wanted.size === 0 && !accountId) return [];
  const db = await getDb();
  return db.bookings
    .filter((b) => wanted.has(b.id) || (accountId !== null && b.accountId === accountId))
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
        pitch: b.pitch,
        halfNames: turf?.halfNames,
        status: b.status,
        total: b.pricing.total,
        due: b.pricing.total - b.amountPaid,
        reviewed: Boolean(b.review),
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

  const ip = clientIpFrom(await headers());
  if (!(await sharedRateLimit(`apply:${ip}`, 5, 60 * 60_000))) return { error: 'Too many applications from your network. Please try again in an hour.' };

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
        eveningPrice: Math.round(Number(fields.eveningPrice)),
        weekendPrice: Math.round(Number(fields.weekendPrice)),
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
    console.error('[booking] submitApplication error:', err);
    return { error: 'Could not submit application. Please try again in a moment.' };
  }
}
