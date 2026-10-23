import { getSlots } from '@/modules/shared/lib/pricing';
import { toPublicTurf } from '@/modules/web/database/public-turf';
import { getDb } from '@/modules/shared/database/store';
import { istNow } from '@/modules/shared/lib/time';
import type { PublicTurf, TurfSummary } from '@/modules/shared/database/types';

// Turfs shown on the public site
export async function listPublicTurfs(): Promise<TurfSummary[]> {
  const db = await getDb();
  const now = istNow();
  return db.turfs
    .filter((t) => t.status === 'active')
    .map((t) => ({ ...toPublicTurf(t), availableToday: getSlots(db, t, now.date, now).filter((s) => s.available).length }));
}

export async function getPublicTurf(id: string): Promise<PublicTurf | null> {
  const turf = (await getDb()).turfs.find((t) => t.id === id);
  return turf && (turf.status === 'active' || turf.status === 'maintenance') ? toPublicTurf(turf) : null;
}

export function listAreas(turfs: PublicTurf[]) {
  return [...new Set(turfs.map((t) => t.area))].sort();
}

export async function getSiteContent() {
  return (await getDb()).site;
}

export async function getSettings() {
  return (await getDb()).settings;
}
