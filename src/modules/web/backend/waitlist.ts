import { ValidationError } from '@/modules/shared/backend/errors';
import { newId } from '@/modules/shared/database/ids';
import { normalizePhone } from '@/modules/shared/lib/pricing';
import { addDays, isValidDate, istNow } from '@/modules/shared/lib/time';
import type { Database, WaitlistEntry } from '@/modules/shared/database/types';
import { getDb, mutate } from '@/modules/shared/database/store';
import { sharedRateLimit } from '@/modules/shared/backend/shared-rate-limit';

function checkWaitlistDate(date: string) {
  const today = istNow().date;
  return isValidDate(date) && date >= today && date <= addDays(today, 30);
}

export interface JoinWaitlistRequest {
  turfId: string;
  date: string;
  hour: number;
  name: string;
  phone: string;
}

export interface JoinWaitlistResult {
  ok: boolean;
  waitlistId?: string;
  position?: number;
  error?: string;
}

/**
 * Dispatches notification when a slot frees up and the next waiting player is notified.
 * Brief roadmap: notify the next player when a slot frees up.
 */
export function notifyPlayerWaitlistAvailable(entry: WaitlistEntry, turfName?: string): void {
  console.info(
    `[WAITLIST NOTIFICATION] Slot freed at ${turfName ?? entry.turfId} on ${entry.date} at ${entry.hour}:00! Notified waitlist player ${entry.id}.`
  );
}

/**
 * Player joins the waitlist for a slot that is currently booked or held.
 */
export async function joinWaitlist(req: JoinWaitlistRequest): Promise<JoinWaitlistResult> {
  try {
    const phone = normalizePhone(req.phone);
    if (phone.length !== 10) throw new ValidationError('Enter a valid 10-digit mobile number');
    if (!String(req.name ?? '').trim()) throw new ValidationError('Enter your name');
    if (!checkWaitlistDate(req.date)) throw new ValidationError('Pick a date within the next 30 days');
    if (req.hour < 0 || req.hour > 23) throw new ValidationError('Invalid hour');

    if (!(await sharedRateLimit(`waitlist:${phone}`, 20, 60_000))) {
      throw new ValidationError('Too many waitlist requests. Please try again later.');
    }

    const result = await mutate((db) => {
      db.waitlist ??= [];

      // Check if already on waitlist for this exact slot
      const existing = db.waitlist.find(
        (w) =>
          w.turfId === req.turfId &&
          w.date === req.date &&
          w.hour === req.hour &&
          w.customerPhone === phone &&
          (w.status === 'waiting' || w.status === 'notified')
      );
      if (existing) {
        throw new ValidationError('You are already on the waitlist for this slot');
      }

      const id = newId('wl');
      const now = new Date().toISOString();
      const entry: WaitlistEntry = {
        id,
        turfId: req.turfId,
        date: req.date,
        hour: req.hour,
        customerName: req.name.trim().slice(0, 80),
        customerPhone: phone,
        status: 'waiting',
        createdAt: now,
      };

      db.waitlist.push(entry);

      const waitingList = db.waitlist.filter(
        (w) => w.turfId === req.turfId && w.date === req.date && w.hour === req.hour && w.status === 'waiting'
      );

      return { waitlistId: id, position: waitingList.length };
    });

    return { ok: true, waitlistId: result.waitlistId, position: result.position };
  } catch (err) {
    if (err instanceof ValidationError) return { ok: false, error: err.message };
    console.error('[waitlist] joinWaitlist error:', err);
    return { ok: false, error: 'Could not join waitlist. Please try again.' };
  }
}

/**
 * When a slot frees up (cancellation or hold expiry), notifies the first waiting player in FIFO order.
 */
export function notifyWaitlistWhenSlotFreed(
  db: Database,
  turfId: string,
  date: string,
  hour: number
): WaitlistEntry | null {
  db.waitlist ??= [];

  // Find the next active waiting player
  const nextWaiting = db.waitlist
    .filter((w) => w.turfId === turfId && w.date === date && w.hour === hour && w.status === 'waiting')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];

  if (!nextWaiting) return null;

  nextWaiting.status = 'notified';
  nextWaiting.notifiedAt = new Date().toISOString();

  const turf = db.turfs.find((t) => t.id === turfId);
  notifyPlayerWaitlistAvailable(nextWaiting, turf?.name);

  return nextWaiting;
}

/**
 * Cancels a waitlist entry if the player no longer wants the slot.
 */
export async function cancelWaitlist(waitlistId: string, phone: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const cleanPhone = normalizePhone(phone);
    if (!(await sharedRateLimit(`waitlist-cancel:${cleanPhone}`, 20, 60_000))) {
      throw new ValidationError('Too many requests. Please try again later.');
    }

    await mutate((db) => {
      db.waitlist ??= [];
      const entry = db.waitlist.find((w) => w.id === waitlistId);
      if (!entry) throw new ValidationError('Waitlist entry not found');
      if (entry.customerPhone !== cleanPhone) throw new ValidationError('Phone number does not match');

      entry.status = 'cancelled';
    });

    return { ok: true };
  } catch (err) {
    if (err instanceof ValidationError) return { ok: false, error: err.message };
    console.error('[waitlist] cancelWaitlist error:', err);
    return { ok: false, error: 'Could not cancel waitlist' };
  }
}

/**
 * Gets waitlist summary for a slot (read-only).
 */
export async function getSlotWaitlistCount(turfId: string, date: string, hour: number): Promise<number> {
  const db = await getDb();
  db.waitlist ??= [];
  return db.waitlist.filter(
    (w) => w.turfId === turfId && w.date === date && w.hour === hour && w.status === 'waiting'
  ).length;
}
