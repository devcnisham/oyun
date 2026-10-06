import { getSlots } from './pricing';
import { getDb } from './store';
import { istNow } from './time';
import type { Turf, TurfSummary } from './types';

// Turfs shown on the public site
export async function listPublicTurfs(): Promise<TurfSummary[]> {
  const db = await getDb();
  const now = istNow();
  return db.turfs
    .filter((t) => t.status === 'active')
    .map((t) => ({ ...t, availableToday: getSlots(db, t, now.date, now).filter((s) => s.available).length }));
}

export async function getPublicTurf(id: string): Promise<Turf | null> {
  const turf = (await getDb()).turfs.find((t) => t.id === id);
  return turf && (turf.status === 'active' || turf.status === 'maintenance') ? turf : null;
}

export function listAreas(turfs: Turf[]) {
  return [...new Set(turfs.map((t) => t.area))].sort();
}

export async function getSiteContent() {
  return (await getDb()).site;
}

export async function getSettings() {
  return (await getDb()).settings;
}
