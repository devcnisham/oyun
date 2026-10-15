'use server';

import { geocode, geocodeQueries, type Coords } from './geocode';
import { getDb, mutate } from './store';
import type { Turf } from './types';

// A few look-ups per call keeps the map quick and Nominatim's one-a-second rule; the map asks again until all are placed
const PER_CALL = 4;
// Turfs that could not be placed since this server started: not retried on every map open
const failed = new Set<string>();

async function place(todo: Turf[]): Promise<Record<string, Coords>> {
  const found: Record<string, Coords> = {};

  for (const turf of todo) {
    let coords: Coords | null = null;
    for (const query of geocodeQueries(turf)) {
      coords = await geocode(query);
      await new Promise((r) => setTimeout(r, 1100));
      if (coords) break;
    }
    if (coords) found[turf.id] = coords;
    else failed.add(turf.id);
  }

  if (Object.keys(found).length) {
    await mutate((db) => {
      for (const t of db.turfs) {
        const c = found[t.id];
        if (c && t.lat === undefined) {
          t.lat = c.lat;
          t.lng = c.lng;
        }
      }
    });
  }
  return found;
}

// Finds map positions for active turfs that have none yet and saves them. Public and read-only to the caller.
export async function locateTurfs(): Promise<Record<string, Coords>> {
  const todo = (await getDb()).turfs.filter((t) => t.status === 'active' && t.lat === undefined && !failed.has(t.id)).slice(0, PER_CALL);
  return place(todo);
}

// The map position of one listed turf, looked up and saved if it has none yet; null when it cannot be placed
export async function locateTurf(id: string): Promise<Coords | null> {
  const turf = (await getDb()).turfs.find((t) => t.id === id && (t.status === 'active' || t.status === 'maintenance'));
  if (!turf) return null;
  if (turf.lat !== undefined && turf.lng !== undefined) return { lat: turf.lat, lng: turf.lng };
  if (failed.has(turf.id)) return null;
  return (await place([turf]))[turf.id] ?? null;
}
