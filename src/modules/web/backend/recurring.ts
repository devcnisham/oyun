import { ValidationError } from '@/modules/shared/backend/errors';
import { newId, newBookingCode } from '@/modules/shared/database/ids';
import { freePart, normalizePhone, rulesFor, slotPrice } from '@/modules/shared/lib/pricing';
import { addDays, formatHour, isValidDate, istNow, parseHour } from '@/modules/shared/lib/time';
import type { Booking, Database, PitchSize } from '@/modules/shared/database/types';
import { getDb, mutate } from '@/modules/shared/database/store';
import { isV2SlotsActive, v2BookRanges, v2CancelBooking, v2Range } from '@/modules/shared/database/v2-slots';
import { v2QuoteOf } from '@/modules/shared/database/v2-bookings';
import { ensureV2Player } from '@/modules/web/backend/v2-checkout';
import { sharedRateLimit } from '@/modules/shared/backend/shared-rate-limit';
import { bookableTurf } from '@/modules/web/lib/booking-plan';
import { createPlayer } from '@/modules/shared/lib/wallet';
import { refreshAll } from '@/modules/shared/backend/action-utils';

export interface RecurringBookingRequest {
  turfId: string;
  startDate: string; // YYYY-MM-DD
  hour: number;
  weeksCount: number; // 2 to 12 weeks
  name: string;
  phone: string;
  size?: PitchSize;
  accountId?: string | null;
}

export interface RecurringBookingResult {
  ok: boolean;
  recurringGroupId?: string;
  bookingIds?: string[];
  dates?: string[];
  error?: string;
}

/**
 * Computes an array of ISO dates separated by 7 days.
 */
export function calculateRecurringDates(startDate: string, weeksCount: number): string[] {
  if (!isValidDate(startDate)) throw new ValidationError('Invalid start date');
  if (weeksCount < 2 || weeksCount > 12) throw new ValidationError('Recurring bookings must be between 2 and 12 weeks');

  const dates: string[] = [];
  for (let i = 0; i < weeksCount; i++) {
    dates.push(addDays(startDate, i * 7));
  }
  return dates;
}

type Turf = NonNullable<ReturnType<typeof bookableTurf>>;

function findOrCreatePlayer(db: Database, req: RecurringBookingRequest, phone: string) {
  let player = req.accountId ? db.players.find((p) => p.accountId === req.accountId) : undefined;
  if (!player && phone.length === 10) {
    player = db.players.find((p) => p.phone === phone);
  }
  return player ?? createPlayer(db, req.name.trim().slice(0, 80), phone, null, req.accountId);
}

function recurringBooking(
  db: Database,
  turf: Turf,
  pitchSize: PitchSize,
  req: RecurringBookingRequest,
  phone: string,
  playerId: string,
  recurringGroupId: string,
  week: number,
  date: string
): Booking {
  const pitch = freePart(db, turf, date, req.hour, pitchSize, null) ?? 'full';
  const { basePrice, price, adjustments } = slotPrice(turf, rulesFor(db, turf.id), date, req.hour, istNow(), pitchSize);
  const advance = Math.min(Math.max(Math.round(price * 0.1), db.settings.minAdvance), db.settings.maxAdvance);
  return {
    id: newId('bk'),
    code: newBookingCode(db),
    turfId: turf.id,
    date,
    hour: req.hour,
    timeLabel: formatHour(req.hour),
    ...(pitch !== 'full' ? { pitch } : {}),
    customerName: req.name.trim().slice(0, 80),
    customerPhone: phone,
    playerId,
    source: 'online',
    createdBy: null,
    addOns: [],
    pricing: {
      basePrice,
      slotPrice: price,
      adjustments,
      addOnTotal: 0,
      subtotal: price,
      offer: null,
      promo: null,
      advance,
      walletDeduction: 0,
      total: price,
    },
    paymentMode: 'venue',
    amountPaid: 0,
    status: 'confirmed',
    checkedInAt: null,
    accountId: req.accountId ?? null,
    recurringGroupId,
    recurringWeek: week + 1,
    createdAt: new Date().toISOString(),
  };
}

// With v2 slots every week is booked in oyun one after another; if one fails, the weeks already booked are cancelled
async function bookRecurringInV2(req: RecurringBookingRequest, phone: string, dates: string[], recurringGroupId: string): Promise<string[]> {
  const db = await getDb();
  const turf = bookableTurf(db, req.turfId);
  if (!turf) throw new ValidationError('This turf is not active');
  const pitchSize: PitchSize = turf.halfPitch && req.size === 'half' ? 'half' : 'full';
  for (const date of dates) {
    if (!freePart(db, turf, date, req.hour, pitchSize, null)) {
      throw new ValidationError(`Slot on ${date} at ${formatHour(req.hour)} is already taken. Please choose another slot or start date.`);
    }
  }
  const playerId = await mutate((d) => findOrCreatePlayer(d, req, phone).id);
  const fresh = await getDb();
  const playerUuid = await ensureV2Player(playerId, req.name.trim().slice(0, 80), phone, req.accountId ?? null);
  const openHour = parseHour(turf.openTime);
  const made: string[] = [];
  const ids: string[] = [];
  for (let i = 0; i < dates.length; i++) {
    const booking = recurringBooking(fresh, turf, pitchSize, req, phone, playerId, recurringGroupId, i, dates[i]);
    const booked = await v2BookRanges({
      turfId: turf.id,
      size: pitchSize,
      courtId: booking.pitch ? `half pitch ${booking.pitch.toLowerCase()}` : undefined,
      ranges: [v2Range(dates[i], req.hour, 0, 60, openHour)],
      name: booking.customerName,
      phone,
      quote: v2QuoteOf(booking),
      playerId: playerUuid,
      date: dates[i],
    });
    if (!booked || !booked.ok) {
      for (const id of made) await v2CancelBooking(id, 'recurring series could not be completed');
      if (!booked) throw new Error('[recurring] could not reach the booking service');
      throw new ValidationError(`${dates[i]}: ${booked.error}`);
    }
    made.push(booked.id);
    ids.push(booking.id);
  }
  return ids;
}

/**
 * Creates recurring weekly bookings for regular teams.
 * Atomically checks that every single weekly slot is free before creating any booking.
 */
export async function createRecurringBookings(req: RecurringBookingRequest): Promise<RecurringBookingResult> {
  try {
    const phone = normalizePhone(req.phone);
    if (phone.length !== 10) throw new ValidationError('Enter a 10-digit mobile number');
    if (!String(req.name ?? '').trim()) throw new ValidationError('Enter your name');
    if (req.hour < 0 || req.hour > 23) throw new ValidationError('Invalid hour');

    const today = istNow().date;
    if (!isValidDate(req.startDate) || req.startDate < today) {
      throw new ValidationError('Start date must be today or in the future');
    }

    const weeks = Math.min(Math.max(req.weeksCount, 2), 12);
    const recurringDates = calculateRecurringDates(req.startDate, weeks);

    if (!(await sharedRateLimit(`recurring-booking:${phone}`, 15, 60_000))) {
      throw new ValidationError('Too many requests. Please try again later.');
    }

    const recurringGroupId = newId('rec');
    let createdIds: string[] = [];

    if (isV2SlotsActive()) {
      createdIds = await bookRecurringInV2(req, phone, recurringDates, recurringGroupId);
      refreshAll();
      return { ok: true, recurringGroupId, bookingIds: createdIds, dates: recurringDates };
    }

    await mutate((db) => {
      const turf = bookableTurf(db, req.turfId);
      if (!turf) throw new ValidationError('This turf is not active');

      const pitchSize = turf.halfPitch && req.size === 'half' ? 'half' : 'full';

      // 1. Pre-validation: ensure EVERY week's slot is free before booking any
      for (const date of recurringDates) {
        const free = freePart(db, turf, date, req.hour, pitchSize, null);
        if (!free) {
          throw new ValidationError(
            `Slot on ${date} at ${formatHour(req.hour)} is already taken. Please choose another slot or start date.`
          );
        }
      }

      // 2. Locate or create player, then 3. create all weekly bookings
      const player = findOrCreatePlayer(db, req, phone);
      recurringDates.forEach((date, i) => {
        const booking = recurringBooking(db, turf, pitchSize, req, phone, player.id, recurringGroupId, i, date);
        db.bookings.push(booking);
        createdIds.push(booking.id);
      });
    });

    refreshAll();

    return {
      ok: true,
      recurringGroupId,
      bookingIds: createdIds,
      dates: recurringDates,
    };
  } catch (err) {
    if (err instanceof ValidationError) return { ok: false, error: err.message };
    console.error('[recurring] createRecurringBookings error:', err);
    return { ok: false, error: 'Could not create recurring bookings. Please try again.' };
  }
}
