import { describe, expect, test } from 'vitest';
import { checkInWindow } from '@/modules/partner/lib/checkin-window';

describe('checkInWindow', () => {
  test('opens one hour before the slot', () => {
    expect(checkInWindow(18, { hour: 16, minute: 59 })).toBe('early');
    expect(checkInWindow(18, { hour: 17, minute: 0 })).toBe('open');
  });
  test('stays open for the whole slot hour', () => {
    expect(checkInWindow(18, { hour: 18, minute: 0 })).toBe('open');
    expect(checkInWindow(18, { hour: 18, minute: 59 })).toBe('open');
  });
  test('closes when the slot ends', () => {
    expect(checkInWindow(18, { hour: 19, minute: 0 })).toBe('late');
  });
});
