import { describe, expect, it } from 'vitest';
import { geocodeQueries } from './geocode';

describe('geocodeQueries', () => {
  it('tries the full address first, then the area', () => {
    expect(geocodeQueries({ name: 'Perfect Pass', location: 'Kodialbail, Mangalore', area: 'Kodialbail', city: 'Mangalore' })).toEqual([
      'Perfect Pass, Kodialbail, Mangalore',
      'Kodialbail, Mangalore',
    ]);
  });
  it('collapses stray whitespace', () => {
    expect(geocodeQueries({ name: ' A  B ', location: 'C', area: 'D', city: 'E' })[0]).toBe('A B, C');
  });
});
