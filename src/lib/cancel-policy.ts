import type { Booking } from './types';

// Players can cancel their own booking up to this long before the slot starts
export const CANCEL_CUTOFF_HOURS = 2;

// Minutes until a slot starts (IST)
function minutesUntil(date: string, hour: number) {
  const start = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00+05:30`).getTime();
  return (start - Date.now()) / 60_000;
}

export function canSelfCancel(b: Pick<Booking, 'status' | 'source' | 'date' | 'hour'>) {
  return b.status === 'confirmed' && b.source === 'online' && minutesUntil(b.date, b.hour) >= CANCEL_CUTOFF_HOURS * 60;
}
