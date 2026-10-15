import { describe, expect, it } from 'vitest';
import { hasOpenSlot, hourInWindow, isTimeWindow } from './availability';

describe('hourInWindow', () => {
  it('splits the day into four parts with no gaps or overlaps', () => {
    for (let h = 0; h < 24; h++) {
      const hits = (['morning', 'afternoon', 'evening', 'night'] as const).filter((w) => hourInWindow(h, w));
      expect(hits).toHaveLength(1);
    }
  });
  it('puts the edges where the labels say', () => {
    expect(hourInWindow(5, 'morning')).toBe(true);
    expect(hourInWindow(12, 'morning')).toBe(false);
    expect(hourInWindow(17, 'evening')).toBe(true);
    expect(hourInWindow(21, 'night')).toBe(true);
    expect(hourInWindow(2, 'night')).toBe(true);
  });
  it('treats hours past midnight as the next day', () => {
    expect(hourInWindow(25, 'night')).toBe(true);
  });
});

describe('hasOpenSlot', () => {
  it('needs any open slot when no part of the day is chosen', () => {
    expect(hasOpenSlot([], '')).toBe(false);
    expect(hasOpenSlot([18], '')).toBe(true);
  });
  it('needs a slot inside the chosen part of the day', () => {
    expect(hasOpenSlot([18], 'evening')).toBe(true);
    expect(hasOpenSlot([18], 'morning')).toBe(false);
  });
});

describe('isTimeWindow', () => {
  it('accepts only known values', () => {
    expect(isTimeWindow('night')).toBe(true);
    expect(isTimeWindow('noon')).toBe(false);
    expect(isTimeWindow(null)).toBe(false);
  });
});
