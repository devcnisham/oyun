import { SPORTS, sportHref } from './sports';

// Light row per turf: all the search box needs, none of the booking data
export type SearchEntry = { id: string; name: string; area: string; location: string; sports: string[] };

export type Suggestion = { kind: 'turf' | 'area' | 'sport'; label: string; hint: string; href: string };

const MAX_PER_KIND = 5;

// Every word must appear somewhere: "perfect kodialbail" finds Perfect Pass in Kodialbail
export function matchesQuery(haystack: string, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hay = haystack.toLowerCase();
  return words.length > 0 && words.every((w) => hay.includes(w));
}

// What the search box offers while typing: matching turfs first, then areas, then sports
export function buildSuggestions(entries: SearchEntry[], query: string): Suggestion[] {
  if (!query.trim()) return [];

  const turfs: Suggestion[] = entries
    .filter((e) => matchesQuery(`${e.name} ${e.area} ${e.location} ${e.sports.join(' ')}`, query))
    .slice(0, MAX_PER_KIND)
    .map((e) => ({ kind: 'turf', label: e.name, hint: `${e.area} · ${e.sports.join(', ')}`, href: `/arenas/${e.id}` }));

  const areas: Suggestion[] = [...new Set(entries.map((e) => e.area))]
    .filter((a) => matchesQuery(a, query))
    .sort()
    .slice(0, MAX_PER_KIND)
    .map((a) => ({
      kind: 'area',
      label: a,
      hint: `${entries.filter((e) => e.area === a).length} venues`,
      href: `/arenas?area=${encodeURIComponent(a)}`,
    }));

  const sports: Suggestion[] = SPORTS.filter((s) => matchesQuery(s.label, query)).map((s) => ({
    kind: 'sport',
    label: s.label,
    hint: `All ${s.place}s`,
    href: sportHref(s.value),
  }));

  return [...turfs, ...areas, ...sports];
}

export const PRICE_STEPS = [500, 800, 1000, 1500, 2000] as const;

// Extra filters on the arenas page: a price cap (0 = none) and amenities that every shown turf must have
export function matchesExtras(
  turf: { pricePerHour: number; amenities: string[] },
  { maxPrice, amenities }: { maxPrice: number; amenities: string[] },
): boolean {
  if (maxPrice > 0 && turf.pricePerHour > maxPrice) return false;
  return amenities.every((a) => turf.amenities.includes(a));
}

export type ArenaFilters = {
  q: string;
  area: string;
  sport: string;
  sort: string;
  maxPrice: number;
  amenities: string[];
  date: string;
  time: string;
  view: 'grid' | 'map';
};

// The arenas URL for the current filters: defaults are left out and unrelated parameters (city, date) are kept
export function filtersToParams(current: URLSearchParams, f: ArenaFilters): URLSearchParams {
  const next = new URLSearchParams(current);
  const set = (key: string, value: string, isDefault: boolean) => (value && !isDefault ? next.set(key, value) : next.delete(key));
  set('q', f.q.trim(), false);
  set('area', f.area, f.area === 'All Areas');
  set('sport', f.sport, f.sport === 'All Sports');
  set('sort', f.sort, f.sort === 'featured');
  set('maxPrice', String(f.maxPrice), f.maxPrice === 0);
  set('date', f.date, false);
  set('time', f.time, false);
  set('view', f.view, f.view === 'grid');
  next.delete('amenity');
  f.amenities.forEach((a) => next.append('amenity', a));
  return next;
}

// A price cap from the URL; anything that is not one of the offered steps means no cap
export function parseMaxPrice(raw: string | null): number {
  const n = Number(raw);
  return (PRICE_STEPS as readonly number[]).includes(n) ? n : 0;
}
