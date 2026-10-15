import { describe, expect, it } from 'vitest';
import { buildSuggestions, matchesExtras, matchesQuery, type SearchEntry } from './search';

const entries: SearchEntry[] = [
  { id: 't1', name: 'Perfect Pass', area: 'Kodialbail', location: 'Kodialbail, Mangalore', sports: ['Football'] },
  { id: 't2', name: 'Smash Arena', area: 'Kadri', location: 'Kadri, Mangalore', sports: ['Badminton', 'Pickleball'] },
];

describe('matchesQuery', () => {
  it('needs every word to match somewhere', () => {
    expect(matchesQuery('Perfect Pass Kodialbail', 'perfect kodialbail')).toBe(true);
    expect(matchesQuery('Perfect Pass Kodialbail', 'perfect kadri')).toBe(false);
  });
  it('never matches an empty query', () => {
    expect(matchesQuery('anything', '   ')).toBe(false);
  });
});

describe('buildSuggestions', () => {
  it('returns nothing for an empty query', () => {
    expect(buildSuggestions(entries, '')).toEqual([]);
  });
  it('lists turfs, then areas, then sports', () => {
    const kinds = buildSuggestions(entries, 'k').map((s) => s.kind);
    expect(kinds.indexOf('turf')).toBeLessThan(kinds.indexOf('area'));
  });
  it('finds a turf by name and links to it', () => {
    expect(buildSuggestions(entries, 'perfect')[0]).toMatchObject({ kind: 'turf', label: 'Perfect Pass', href: '/arenas/t1' });
  });
  it('finds a sport and an area', () => {
    expect(buildSuggestions(entries, 'pickle').some((s) => s.kind === 'sport' && s.label === 'Pickleball')).toBe(true);
    expect(buildSuggestions(entries, 'kadri').some((s) => s.kind === 'area' && s.href === '/arenas?area=Kadri')).toBe(true);
  });
});

describe('matchesExtras', () => {
  const turf = { pricePerHour: 800, amenities: ['Parking', 'Floodlights'] };
  it('keeps everything when no filter is set', () => {
    expect(matchesExtras(turf, { maxPrice: 0, amenities: [] })).toBe(true);
  });
  it('drops turfs above the price cap, keeps ones at it', () => {
    expect(matchesExtras(turf, { maxPrice: 800, amenities: [] })).toBe(true);
    expect(matchesExtras(turf, { maxPrice: 799, amenities: [] })).toBe(false);
  });
  it('needs every chosen amenity', () => {
    expect(matchesExtras(turf, { maxPrice: 0, amenities: ['Parking', 'Floodlights'] })).toBe(true);
    expect(matchesExtras(turf, { maxPrice: 0, amenities: ['Parking', 'Showers'] })).toBe(false);
  });
});
