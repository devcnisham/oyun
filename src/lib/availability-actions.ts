'use server';

import { getSlots } from './pricing';
import { getDb } from './store';
import { BOOKING_DAYS, addDays, isValidDate, istNow } from './time';

// Start hours of the slots still open on a day, for every active turf. A date outside the booking window gives {}.
export async function getOpenHours(date: string): Promise<Record<string, number[]>> {
  const now = istNow();
  if (!isValidDate(date) || date < now.date || date > addDays(now.date, BOOKING_DAYS - 1)) return {};
  const db = await getDb();
  const out: Record<string, number[]> = {};
  for (const turf of db.turfs) {
    if (turf.status !== 'active') continue;
    out[turf.id] = getSlots(db, turf, date, now).filter((s) => s.available).map((s) => s.hour);
  }
  return out;
}
