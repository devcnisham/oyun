import type { Turf } from './types';

export type Coords = { lat: number; lng: number };

// Mangalore and its surroundings (left, top, right, bottom): keeps look-ups from landing in another city
const VIEWBOX = '74.70,13.15,75.10,12.70';

// Most specific first: the full address, then just the area
export function geocodeQueries(turf: Pick<Turf, 'name' | 'location' | 'area' | 'city'>): string[] {
  const clean = (v: string) => v.replace(/\s+/g, ' ').trim();
  return [`${clean(turf.name)}, ${clean(turf.location)}`, `${clean(turf.area)}, ${clean(turf.city)}`];
}

// OpenStreetMap Nominatim; its usage policy asks for an identifying User-Agent and one request a second
export async function geocode(query: string): Promise<Coords | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&viewbox=${VIEWBOX}&bounded=1&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'oyun-arena/1.0 (https://oyun.in)' }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const rows = (await res.json()) as { lat?: string; lon?: string }[];
    const lat = Number(rows[0]?.lat);
    const lng = Number(rows[0]?.lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
}
