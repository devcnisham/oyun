import { isOutdoorTurf } from '@/modules/shared/lib/weather';
import type { Database, Turf } from '@/modules/shared/database/types';

// Rain policy (P13-15). A date counts as rained out for an outdoor turf when its owner marked it, or the admin
// declared a city-wide rain day. Indoor and covered turfs never qualify. Pure: the booking page and the
// cancel and reschedule actions both call this, so the server never trusts a flag from the client.
export function isRainDisruption(
  turf: Pick<Turf, 'amenities' | 'rainOutDates'> | null | undefined,
  date: string,
  db: Pick<Database, 'settings'>
): boolean {
  if (!turf || !isOutdoorTurf(turf)) return false;
  if (turf.rainOutDates?.includes(date)) return true;
  return db.settings?.rainDays?.includes(date) ?? false;
}

// Keep the list short and sorted: dates that have passed are dropped when a new one is added
export function withDate(list: string[] | undefined, date: string, today: string): string[] {
  return [...new Set([...(list ?? []), date])].filter((d) => d >= today).sort();
}

export function withoutDate(list: string[] | undefined, date: string): string[] {
  return (list ?? []).filter((d) => d !== date);
}
