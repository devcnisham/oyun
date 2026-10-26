import type { IstNow } from '@/modules/shared/lib/time';

// Desk check-in opens an hour before the slot starts and closes when the slot ends.
const CHECKIN_EARLY_MINUTES = 60;

export type CheckInWindow = 'early' | 'open' | 'late';

export function checkInWindow(
  slotHour: number,
  now: Pick<IstNow, 'hour' | 'minute'>,
  durationMinutes: number = 60,
  startMinute: number = 0,
  openHour: number = 0
): CheckInWindow {
  let minutes = now.hour * 60 + now.minute;
  let start = slotHour * 60 + startMinute;

  // Cross-midnight normalization for evening sessions
  if (openHour > 0 && slotHour < openHour && now.hour >= openHour) {
    start += 24 * 60;
  } else if (openHour > 0 && slotHour >= openHour && now.hour < openHour) {
    minutes += 24 * 60;
  }

  if (minutes < start - CHECKIN_EARLY_MINUTES) return 'early';
  if (minutes >= start + durationMinutes) return 'late';
  return 'open';
}
