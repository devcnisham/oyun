import { ValidationError } from './errors';
import { newId, newBookingCode } from './ids';
import { freePart, normalizePhone, rulesFor, slotPrice } from './pricing';
import { addDays, formatHour, isValidDate, istNow } from './time';
import type { Booking, PitchSize } from './types';
import { getDb, mutate } from './store';
import { sharedRateLimit } from './shared-rate-limit';
import { bookableTurf } from './booking-plan';
import { createPlayer } from './wallet';
import { refreshAll } from './action-utils';

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
    const createdIds: string[] = [];

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

      // 2. Locate or create player
      let player = req.accountId ? db.players.find((p) => p.accountId === req.accountId) : undefined;
      if (!player && phone.length === 10) {
        player = db.players.find((p) => p.phone === phone);
      }
      if (!player) {
        player = createPlayer(db, req.name.trim().slice(0, 80), phone, null, req.accountId);
      }

      // 3. Create all weekly bookings
      for (let i = 0; i < recurringDates.length; i++) {
        const date = recurringDates[i];
        const pitch = freePart(db, turf, date, req.hour, pitchSize, null) ?? 'full';
        const rules = rulesFor(db, turf.id);
        const { basePrice, price, adjustments } = slotPrice(turf, rules, date, req.hour, istNow(), pitchSize);
        const advance = Math.min(Math.max(Math.round(price * 0.1), db.settings.minAdvance), db.settings.maxAdvance);

        const bookingId = newId('bk');
        const booking: Booking = {
          id: bookingId,
          code: newBookingCode(db),
          turfId: turf.id,
          date,
          hour: req.hour,
          timeLabel: formatHour(req.hour),
          ...(pitch !== 'full' ? { pitch } : {}),
          customerName: req.name.trim().slice(0, 80),
          customerPhone: phone,
          playerId: player.id,
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
          recurringWeek: i + 1,
          createdAt: new Date().toISOString(),
        };

        db.bookings.push(booking);
        createdIds.push(bookingId);
      }
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

/**
 * Gets all bookings in a recurring booking group.
 */
export async function getRecurringGroupBookings(recurringGroupId: string): Promise<Booking[]> {
  const db = await getDb();
  return db.bookings
    .filter((b) => b.recurringGroupId === recurringGroupId)
    .sort((a, b) => (a.recurringWeek ?? 0) - (b.recurringWeek ?? 0));
}
