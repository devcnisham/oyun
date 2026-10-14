import { mapTurfToVenue } from './data-mapping';
import { turfHours } from './pricing';
import { addDays, dayOfWeek, formatSlotRange } from './time';
import type { Booking, Database, PublicTurf } from './types';

// The partner calendar: one turf, day or week view across courts (task RQ-F3).

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

export interface CalendarCourtCell {
  hour: number;
  courtId: string;
  courtName: string;
  state: CalendarState;
  bookings: CalendarBooking[];
  blockReason: string | null;
  blockId: string | null;
}

export interface CalendarDayRow {
  hour: number;
  timeLabel: string;
  cells: CalendarCourtCell[];
}

export interface CalendarDayView {
  date: string;
  isToday: boolean;
  courts: { id: string; name: string }[];
  hours: number[];
  rows: CalendarDayRow[];
  booked: number;
}

// Bookings that occupy the pitch (a no-show still held it)
const TAKING = new Set<Booking['status']>(['confirmed', 'checked_in', 'no_show']);

// The Monday on or before `date`
export function weekStart(date: string) {
  const dow = dayOfWeek(date); // 0 = Sunday
  return addDays(date, dow === 0 ? -6 : 1 - dow);
}

export function getCourtsForTurf(turf: PublicTurf): { id: string; name: string }[] {
  const mapped = mapTurfToVenue(turf);
  return mapped.resources.map((r) => ({ id: r.id, name: r.name }));
}

function bookingMatchesCourt(b: Booking, court: { id: string; name: string }, isHalfPitch: boolean, totalCourts: number): boolean {
  if (totalCourts <= 1) return true;
  if (isHalfPitch) {
    if (court.name.includes('Half A')) return b.pitch === 'A' || !b.pitch || b.pitch === 'full';
    if (court.name.includes('Half B')) return b.pitch === 'B' || !b.pitch || b.pitch === 'full';
  }
  if (b.pitch === court.name || b.pitch === court.id) return true;
  if (!b.pitch || b.pitch === 'full') return true;
  return false;
}

function blockMatchesCourt(b: { pitch?: string; hour: number }, court: { id: string; name: string }, isHalfPitch: boolean, totalCourts: number): boolean {
  if (totalCourts <= 1) return true;
  if (b.pitch) {
    if (isHalfPitch) {
      if (court.name.includes('Half A') && b.pitch === 'A') return true;
      if (court.name.includes('Half B') && b.pitch === 'B') return true;
    }
    return b.pitch === court.name || b.pitch === court.id;
  }
  return true;
}

function holdMatchesCourt(h: { pitch?: string; hour: number }, court: { id: string; name: string }, isHalfPitch: boolean, totalCourts: number): boolean {
  if (totalCourts <= 1) return true;
  if (isHalfPitch) {
    if (court.name.includes('Half A')) return h.pitch === 'A' || !h.pitch || h.pitch === 'full';
    if (court.name.includes('Half B')) return h.pitch === 'B' || !h.pitch || h.pitch === 'full';
  }
  if (h.pitch === court.name || h.pitch === court.id) return true;
  if (!h.pitch || h.pitch === 'full') return true;
  return false;
}

export function buildWeek(
  db: Database,
  turf: PublicTurf,
  start: string,
  now: { date: string; hour: number },
  courtFilter?: string
): { hours: number[]; days: CalendarDay[]; courts: { id: string; name: string }[] } {
  const hours = turfHours(turf);
  const courts = getCourtsForTurf(turf);
  const selectedCourt = courtFilter && courtFilter !== 'all' ? courts.find((c) => c.id === courtFilter || c.name === courtFilter) : null;
  const nowIso = new Date().toISOString();

  const days: CalendarDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    let dayBookings = db.bookings.filter((b) => b.turfId === turf.id && b.date === date && TAKING.has(b.status));
    let dayBlocks = db.blocks.filter((b) => b.turfId === turf.id && b.date === date);
    let dayHolds = (db.holds ?? []).filter((h) => h.turfId === turf.id && h.date === date && h.expiresAt > nowIso);

    if (selectedCourt) {
      dayBookings = dayBookings.filter((b) => bookingMatchesCourt(b, selectedCourt, !!turf.halfPitch, courts.length));
      dayBlocks = dayBlocks.filter((b) => blockMatchesCourt(b, selectedCourt, !!turf.halfPitch, courts.length));
      dayHolds = dayHolds.filter((h) => holdMatchesCourt(h, selectedCourt, !!turf.halfPitch, courts.length));
    }

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

  return { hours, days, courts };
}

export function buildDay(
  db: Database,
  turf: PublicTurf,
  date: string,
  now: { date: string; hour: number }
): CalendarDayView {
  const courts = getCourtsForTurf(turf);
  const hours = turfHours(turf);
  const nowIso = new Date().toISOString();

  const dayBookings = db.bookings.filter((b) => b.turfId === turf.id && b.date === date && TAKING.has(b.status));
  const dayBlocks = db.blocks.filter((b) => b.turfId === turf.id && b.date === date);
  const dayHolds = (db.holds ?? []).filter((h) => h.turfId === turf.id && h.date === date && h.expiresAt > nowIso);

  let totalBooked = 0;

  const rows: CalendarDayRow[] = hours.map((hour) => {
    const past = date < now.date || (date === now.date && hour < now.hour);
    const hourBookings = dayBookings.filter((b) => b.hour === hour || (b.hours && b.hours.includes(hour)));
    const hourBlocks = dayBlocks.filter((b) => b.hour === hour);
    const hourHolds = dayHolds.filter((h) => h.hour === hour);

    const cells: CalendarCourtCell[] = courts.map((court) => {
      const courtBookings = hourBookings
        .filter((b) => bookingMatchesCourt(b, court, !!turf.halfPitch, courts.length))
        .map((b) => ({
          id: b.id,
          code: b.code,
          name: b.customerName,
          phone: b.customerPhone,
          status: b.status,
          source: b.source,
          part: b.pitch ?? 'full',
        } as CalendarBooking));

      const block = hourBlocks.find((b) => blockMatchesCourt(b, court, !!turf.halfPitch, courts.length)) ?? null;
      const courtHeld = hourHolds.some((h) => holdMatchesCourt(h, court, !!turf.halfPitch, courts.length));

      const state: CalendarState =
        courtBookings.length > 0 ? 'booked' : block ? 'blocked' : courtHeld ? 'held' : past ? 'past' : 'free';

      totalBooked += courtBookings.length;

      return {
        hour,
        courtId: court.id,
        courtName: court.name,
        state,
        bookings: courtBookings,
        blockReason: block?.reason ?? null,
        blockId: block?.id ?? null,
      };
    });

    return {
      hour,
      timeLabel: formatSlotRange(hour),
      cells,
    };
  });

  return {
    date,
    isToday: date === now.date,
    courts,
    hours,
    rows,
    booked: totalBooked,
  };
}
