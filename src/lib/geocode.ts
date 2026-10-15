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

// Latitude and longitude typed by an admin: both or neither. Neither clears the saved position so it is looked up again.
export function parseCoordinates(latRaw: string, lngRaw: string): Coords | null {
  const lat = latRaw.trim();
  const lng = lngRaw.trim();
  if (!lat && !lng) return null;
  if (!lat || !lng) throw new Error('Enter both latitude and longitude, or leave both blank');
  const coords = { lat: Number(lat), lng: Number(lng) };
  if (!Number.isFinite(coords.lat) || coords.lat < -90 || coords.lat > 90) throw new Error('Latitude must be between -90 and 90');
  if (!Number.isFinite(coords.lng) || coords.lng < -180 || coords.lng > 180) throw new Error('Longitude must be between -180 and 180');
  return coords;
}
