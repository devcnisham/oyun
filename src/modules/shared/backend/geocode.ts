import type { Turf } from '@/modules/shared/database/types';

export type Coords = { lat: number; lng: number };

// Most specific first: the full address, then just the area
export function geocodeQueries(turf: Pick<Turf, 'name' | 'location' | 'area' | 'city'>): string[] {
  const clean = (v: string) => v.replace(/\s+/g, ' ').trim();
  return [`${clean(turf.name)}, ${clean(turf.location)}`, `${clean(turf.area)}, ${clean(turf.city)}`];
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
