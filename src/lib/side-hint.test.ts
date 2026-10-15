import { describe, expect, test } from 'vitest';
import { swapHours } from './side-hint';
import type { Slot } from './types';

const slot = (hour: number, available: boolean, reason: Slot['reason'] = null): Slot => ({
  date: '2026-10-19', hour, minute: 0, durationMinutes: 60, label: '', basePrice: 0, price: 0, tags: [], available, reason,
});

describe('swapHours', () => {
  test('lists hours taken on this side but free on the other', () => {
    const chosen = [slot(18, false, 'booked'), slot(19, false, 'held'), slot(20, true), slot(21, false, 'booked')];
    const other = [slot(18, true), slot(19, false, 'booked'), slot(20, true), slot(21, true)];
    expect(swapHours(chosen, other)).toEqual([18, 21]);
  });

  test('ignores past and blocked hours', () => {
    expect(swapHours([slot(6, false, 'past'), slot(7, false, 'blocked')], [slot(6, true), slot(7, true)])).toEqual([]);
  });
});
