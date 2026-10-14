import type { IstNow } from './time';

// Desk check-in opens an hour before the slot starts and closes when the slot ends.
const CHECKIN_EARLY_MINUTES = 60;

export type CheckInWindow = 'early' | 'open' | 'late';

export function checkInWindow(
  slotHour: number,
  now: Pick<IstNow, 'hour' | 'minute'>,
  slotDurationMinutes: number = 60
): CheckInWindow {
  // If slotHour >= 24 (past midnight) and now.hour < 6 (early morning next day),
  // offset now.hour by 24 so the timeline lines up with the operational booking date.
  const effectiveNowHour = slotHour >= 24 && now.hour < 6 ? now.hour + 24 : now.hour;
  const minutes = effectiveNowHour * 60 + now.minute;
  const start = slotHour * 60;
  if (minutes < start - CHECKIN_EARLY_MINUTES) return 'early';
  if (minutes >= start + slotDurationMinutes) return 'late';
  return 'open';
}
