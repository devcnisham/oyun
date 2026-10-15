import { describe, expect, it } from 'vitest';
import { geocodeQueries, parseCoordinates } from './geocode';

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

describe('parseCoordinates', () => {
  it('reads a valid pair', () => {
    expect(parseCoordinates('12.9141', ' 74.856 ')).toEqual({ lat: 12.9141, lng: 74.856 });
  });
  it('treats two blanks as clearing the position', () => {
    expect(parseCoordinates('', '  ')).toBeNull();
  });
  it('rejects half a pair, junk and out-of-range values', () => {
    expect(() => parseCoordinates('12.9', '')).toThrow(/both/);
    expect(() => parseCoordinates('abc', '74')).toThrow(/Latitude/);
    expect(() => parseCoordinates('91', '74')).toThrow(/Latitude/);
    expect(() => parseCoordinates('12', '181')).toThrow(/Longitude/);
  });
});
