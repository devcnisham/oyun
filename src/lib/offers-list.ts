import { shortHour } from './format';
import { platformOffersOf } from './platform-offers';
import type { Database } from './types';

export interface OfferLine {
  id: string;
  title: string;
  detail: string;
  turfId?: string;
  turfName?: string;
}

/**
 * The offers a player can use right now, for the public Offers page: the platform-wide offers an admin has switched on,
 * and each public turf's own active happy-hour and first-booking offers. Nothing is listed that is switched off.
 */
export function listLiveOffers(
  db: Pick<Database, 'offers' | 'settings'>,
  publicTurfs: { id: string; name: string }[]
): { platform: OfferLine[]; turf: OfferLine[] } {
  const { regular, student } = platformOffersOf(db.settings);
  const platform: OfferLine[] = [];
  if (regular.active) platform.push({ id: 'platform_regular', title: regular.title, detail: `${regular.percentOff}% off every booking` });
  if (student.active) platform.push({ id: 'platform_student', title: student.title, detail: `${student.percentOff}% off for approved students. Send your student ID at checkout.` });

  const names = new Map(publicTurfs.map((t) => [t.id, t.name]));
  const turf: OfferLine[] = [];
  for (const o of db.offers) {
    if (!o.active || !names.has(o.turfId)) continue;
    if (o.type === 'happy_hour') turf.push({ id: o.id, title: o.title, detail: `${o.percentOff}% off from ${shortHour(o.startHour)} to ${shortHour(o.endHour)}`, turfId: o.turfId, turfName: names.get(o.turfId) });
    else if (o.type === 'first_time') turf.push({ id: o.id, title: o.title, detail: `${o.percentOff}% off your first booking here`, turfId: o.turfId, turfName: names.get(o.turfId) });
  }
  turf.sort((a, b) => (a.turfName ?? '').localeCompare(b.turfName ?? ''));
  return { platform, turf };
}
