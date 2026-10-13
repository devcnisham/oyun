import { unstable_cache } from 'next/cache';
import { getSlots } from './pricing';
import { toPublicTurf } from './public-turf';
import { getDb } from './store';
import { istNow } from './time';
import type { PublicTurf, TurfSummary } from './types';

export const TAG_PUBLIC_TURFS = 'public-turfs';
export const TAG_SITE_CONTENT = 'site-content';
export const TAG_SETTINGS = 'settings';

function cacheQuery<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  keyParts: string[],
  options?: { tags?: string[]; revalidate?: number | false }
): (...args: Args) => Promise<R> {
  // In test runs, unstable_cache throws because incrementalCache context is absent
  if (process.env.NODE_ENV === 'test') {
    return fn;
  }
  try {
    return unstable_cache(fn as unknown as (...args: unknown[]) => Promise<R>, keyParts, options) as unknown as (
      ...args: Args
    ) => Promise<R>;
  } catch {
    return fn;
  }
}

// Turfs shown on the public site
async function fetchPublicTurfs(): Promise<TurfSummary[]> {
  const db = await getDb();
  const now = istNow();
  return db.turfs
    .filter((t) => t.status === 'active')
    .map((t) => ({ ...toPublicTurf(t), availableToday: getSlots(db, t, now.date, now).filter((s) => s.available).length }));
}

export const listPublicTurfs = cacheQuery(fetchPublicTurfs, ['list-public-turfs'], {
  tags: [TAG_PUBLIC_TURFS],
  revalidate: 60,
});

async function fetchPublicTurf(id: string): Promise<PublicTurf | null> {
  const turf = (await getDb()).turfs.find((t) => t.id === id);
  return turf && (turf.status === 'active' || turf.status === 'maintenance') ? toPublicTurf(turf) : null;
}

export const getPublicTurf = cacheQuery(fetchPublicTurf, ['get-public-turf'], {
  tags: [TAG_PUBLIC_TURFS],
  revalidate: 60,
});

export function listAreas(turfs: PublicTurf[]) {
  return [...new Set(turfs.map((t) => t.area))].sort();
}

async function fetchSiteContent() {
  return (await getDb()).site;
}

export const getSiteContent = cacheQuery(fetchSiteContent, ['get-site-content'], {
  tags: [TAG_SITE_CONTENT],
  revalidate: 60,
});

async function fetchSettings() {
  return (await getDb()).settings;
}

export const getSettings = cacheQuery(fetchSettings, ['get-settings'], {
  tags: [TAG_SETTINGS],
  revalidate: 60,
});

