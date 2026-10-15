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
