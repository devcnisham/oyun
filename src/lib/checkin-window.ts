import type { IstNow } from './time';

// Desk check-in opens an hour before the slot starts and closes when the slot ends.
export const CHECKIN_EARLY_MINUTES = 60;

export type CheckInWindow = 'early' | 'open' | 'late';

export function checkInWindow(slotHour: number, now: Pick<IstNow, 'hour' | 'minute'>): CheckInWindow {
  const minutes = now.hour * 60 + now.minute;
  const start = slotHour * 60;
  if (minutes < start - CHECKIN_EARLY_MINUTES) return 'early';
  if (minutes >= start + 60) return 'late';
  return 'open';
}
