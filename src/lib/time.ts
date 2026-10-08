// Players can book today and the next 6 days (one week shown in the date picker)
export const BOOKING_DAYS = 7;

// All booking times are in India Standard Time, regardless of server timezone
const IST = 'Asia/Kolkata';

export interface IstNow {
  date: string; // YYYY-MM-DD
  hour: number;
  minute: number;
}

export function istNow(at: Date = new Date()): IstNow {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number(get('hour')),
    minute: Number(get('minute')),
  };
}

// Date strings are treated as calendar dates (UTC noon avoids DST/offset edge cases)
function toUtcNoon(date: string) {
  return new Date(`${date}T12:00:00Z`);
}

export function addDays(date: string, days: number) {
  const d = toUtcNoon(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function dayOfWeek(date: string) {
  return toUtcNoon(date).getUTCDay(); // 0 = Sunday
}

export function isWeekend(date: string) {
  const d = dayOfWeek(date);
  return d === 0 || d === 6;
}

export function isValidDate(date: string) {
  // Round-trip so 2026-02-31 (which JavaScript rolls over to March) is rejected
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(toUtcNoon(date).getTime()) && toUtcNoon(date).toISOString().slice(0, 10) === date;
}

export function formatHour(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:00 ${suffix}`;
}

export function formatSlotRange(hour: number) {
  return `${formatHour(hour)} – ${formatHour(hour + 1)}`;
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return new Intl.DateTimeFormat('en-IN', { ...opts, timeZone: 'UTC' }).format(toUtcNoon(date));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function parseHour(time: string) {
  const [h] = time.split(':');
  const n = Number(h);
  return Number.isFinite(n) ? n : 0;
}

// Monday of the week containing `date`
export function weekStart(date: string) {
  const dow = dayOfWeek(date);
  return addDays(date, dow === 0 ? -6 : 1 - dow);
}
