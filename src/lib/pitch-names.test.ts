import { describe, expect, test } from 'vitest';
import { halfNote } from './pricing';
import { isHalfBookable, mapTurfToResourcesAndBookables } from './venue-mapping';
import { turfSeeds } from '@/data/turfs';
import type { PublicTurf } from './types';

const seed = (id: string) => {
  const t = turfSeeds.find((s) => s.id === id);
  if (!t) throw new Error(`seed ${id} missing`);
  return { ...t, city: 'Mangalore', status: 'active' as const } as PublicTurf;
};

describe('named pitch halves', () => {
  test('a split pitch with named halves offers Right, Left and Full Court', () => {
    const { bookables } = mapTurfToResourcesAndBookables(seed('perfect-pass-kodialbail'));
    expect(bookables.map((b) => b.name)).toEqual(['Full Court', '5-a-side (Right)', '5-a-side (Left)']);
  });

  test('a split pitch without names keeps the generic offers', () => {
    const turf = { ...seed('perfect-pass-kodialbail'), halfNames: undefined };
    const { bookables } = mapTurfToResourcesAndBookables(turf);
    expect(bookables.map((b) => b.name)).toEqual(['Full Pitch (7-a-side)', 'Half Pitch A (5-a-side)', 'Half Pitch B (5-a-side)']);
  });

  test('halves are told apart by the resources they use, not by their names', () => {
    const turf = seed('greens-field-ullal');
    const { bookables } = mapTurfToResourcesAndBookables(turf);
    expect(bookables.map((b) => isHalfBookable(turf, b))).toEqual([false, true, true]);
    expect(isHalfBookable({ halfPitch: false }, { resourceIds: ['x'] })).toBe(false);
  });

  test('a booking shows the half by its name, or generically when the turf has none', () => {
    const names = { A: '5-a-side (Right)', B: '5-a-side (Left)' };
    expect(halfNote('B', names)).toBe(' · 5-a-side (Left)');
    expect(halfNote('A')).toBe(' · Half pitch (A)');
    expect(halfNote('full', names)).toBe('');
    expect(halfNote(undefined, names)).toBe('');
  });

  test('the real formats are in the launch data', () => {
    const formats = (id: string) => turfSeeds.find((s) => s.id === id)?.formats;
    expect(formats('futsal-dugout-pandeshwar')).toEqual(['5-a-side', '6-a-side']);
    expect(formats('city-arena-kodialbail')).toEqual(['5-a-side', '6-a-side']);
    expect(formats('squad-x-kankanady')).toEqual(['6-a-side', '7-a-side']);
    for (const id of ['perfect-pass-kodialbail', 'greens-field-ullal']) {
      expect(formats(id)).toEqual(['5-a-side (Right)', '5-a-side (Left)', 'Full Court']);
    }
  });
});
