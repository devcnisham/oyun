import { describe, expect, it } from 'vitest';
import { buildSuggestions, filtersToParams, matchesExtras, matchesQuery, parseMaxPrice, type ArenaFilters, type SearchEntry } from './search';

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

describe('filtersToParams', () => {
  const none: ArenaFilters = { q: '', area: 'All Areas', sport: 'All Sports', sort: 'featured', maxPrice: 0, amenities: [], date: '', time: '', view: 'grid' };
  it('leaves defaults out and keeps unrelated parameters', () => {
    expect(filtersToParams(new URLSearchParams('city=Mangalore'), none).toString()).toBe('city=Mangalore');
  });
  it('writes every active filter, one amenity parameter each', () => {
    const f = { ...none, q: ' pass ', area: 'Kadri', sport: 'Football', sort: 'rating', maxPrice: 800, amenities: ['Parking', 'Floodlights'], date: '2026-10-20', time: 'evening', view: 'map' as const };
    const p = filtersToParams(new URLSearchParams(), f);
    expect(p.get('q')).toBe('pass');
    expect(p.get('area')).toBe('Kadri');
    expect(p.get('maxPrice')).toBe('800');
    expect(p.getAll('amenity')).toEqual(['Parking', 'Floodlights']);
    expect(p.get('date')).toBe('2026-10-20');
    expect(p.get('time')).toBe('evening');
    expect(p.get('view')).toBe('map');
  });
  it('removes parameters for filters that were cleared', () => {
    expect(filtersToParams(new URLSearchParams('q=x&maxPrice=800&amenity=Parking&date=2026-10-20&time=night'), none).toString()).toBe('');
  });
});

describe('parseMaxPrice', () => {
  it('accepts only the offered steps', () => {
    expect(parseMaxPrice('800')).toBe(800);
    expect(parseMaxPrice('750')).toBe(0);
    expect(parseMaxPrice(null)).toBe(0);
  });
});
