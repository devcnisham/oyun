import { getSlots } from './pricing';
import { getDb } from './store';
import { istNow } from './time';
import type { Turf, TurfSummary } from './types';

// Turfs shown on the public site
export function listPublicTurfs(): TurfSummary[] {
  const db = getDb();
  const now = istNow();
  return db.turfs
    .filter((t) => t.status === 'active')
    .map((t) => ({ ...t, availableToday: getSlots(db, t, now.date, now).filter((s) => s.available).length }));
}

export function getPublicTurf(id: string): Turf | null {
  const turf = getDb().turfs.find((t) => t.id === id);
  return turf && (turf.status === 'active' || turf.status === 'maintenance') ? turf : null;
}

export function listAreas(turfs: Turf[]) {
  return [...new Set(turfs.map((t) => t.area))].sort();
}

export function getSiteContent() {
  return getDb().site;
}

export function getSettings() {
  return getDb().settings;
}
