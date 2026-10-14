import { turfHours } from './pricing';
import { addDays, dayOfWeek } from './time';
import type { Booking, Database, PublicTurf } from './types';

// The partner calendar: one turf, seven days, every opening hour (task RQ-F3).

export type CalendarState = 'past' | 'free' | 'booked' | 'blocked' | 'held';

export interface CalendarBooking {
  id: string;
  code: string;
  name: string;
  phone: string;
  status: Booking['status'];
  source: Booking['source'];
  part: 'full' | 'A' | 'B';
}

export interface CalendarCell {
  date: string;
  hour: number;
  state: CalendarState;
  bookings: CalendarBooking[];
  blockReason: string | null;
  blockId: string | null;
}

export interface CalendarDay {
  date: string;
  isToday: boolean;
  cells: CalendarCell[];
  booked: number; // bookings that day (a split hour counts two)
}

// Bookings that occupy the pitch (a no-show still held it)
const TAKING = new Set<Booking['status']>(['confirmed', 'checked_in', 'no_show']);

// The Monday on or before `date`
export function weekStart(date: string) {
  const dow = dayOfWeek(date); // 0 = Sunday
  return addDays(date, dow === 0 ? -6 : 1 - dow);
}

export function buildWeek(db: Database, turf: PublicTurf, start: string, now: { date: string; hour: number }): { hours: number[]; days: CalendarDay[] } {
  const hours = turfHours(turf);
  const nowIso = new Date().toISOString();
  const days: CalendarDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    const dayBookings = db.bookings.filter((b) => b.turfId === turf.id && b.date === date && TAKING.has(b.status));
    const dayBlocks = db.blocks.filter((b) => b.turfId === turf.id && b.date === date);
    const dayHolds = (db.holds ?? []).filter((h) => h.turfId === turf.id && h.date === date && h.expiresAt > nowIso);

    const cells: CalendarCell[] = hours.map((hour) => {
      const bookings = dayBookings
        .filter((b) => b.hour === hour || (b.hours && b.hours.includes(hour)))
        .map((b) => ({ id: b.id, code: b.code, name: b.customerName, phone: b.customerPhone, status: b.status, source: b.source, part: b.pitch ?? 'full' }) as CalendarBooking);
      const block = dayBlocks.find((b) => b.hour === hour) ?? null;
      const past = date < now.date || (date === now.date && hour < now.hour);
      const state: CalendarState = bookings.length > 0 ? 'booked' : block ? 'blocked' : dayHolds.some((h) => h.hour === hour) ? 'held' : past ? 'past' : 'free';
      return { date, hour, state, bookings, blockReason: block?.reason ?? null, blockId: block?.id ?? null };
    });
    return { date, isToday: date === now.date, cells, booked: cells.reduce((n, c) => n + c.bookings.length, 0) };
  });
  return { hours, days };
}
