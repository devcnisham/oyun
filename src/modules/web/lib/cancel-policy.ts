import { slotTimestamp } from '@/modules/shared/lib/time';
import type { Booking } from '@/modules/shared/database/types';

// Players can cancel their own booking up to this long before the slot starts
export const CANCEL_CUTOFF_HOURS = 2;

// Minutes until a slot starts (IST)
function minutesUntil(date: string, hour: number, startMinute: number = 0) {
  const start = new Date(slotTimestamp(date, hour, 0, startMinute)).getTime();
  return (start - Date.now()) / 60_000;
}

export function canSelfCancel(
  b: Pick<Booking, 'status' | 'source' | 'date' | 'hour'> & { startMinute?: number },
  isWeatherDisruption = false
) {
  if (b.status !== 'confirmed') return false;
  if (isWeatherDisruption) {
    // Under Rain Policy, players can cancel up to the start of the slot without cutoff penalty
    return b.source === 'online' && minutesUntil(b.date, b.hour, b.startMinute ?? 0) >= 0;
  }
  return b.source === 'online' && minutesUntil(b.date, b.hour, b.startMinute ?? 0) >= CANCEL_CUTOFF_HOURS * 60;
}

export function canReschedule(
  b: Pick<Booking, 'status' | 'source' | 'date' | 'hour'>,
  isWeatherDisruption = false
) {
  return canSelfCancel(b, isWeatherDisruption);
}
