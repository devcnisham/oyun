import { describe, expect, test } from 'vitest';
import { checkInWindow } from './checkin-window';

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
  test('handles after-midnight slots correctly', () => {
    // Slot at 24:00 (midnight). Opens at 23:00, closes at 01:00 (next day hour 1)
    expect(checkInWindow(24, { hour: 22, minute: 59 })).toBe('early');
    expect(checkInWindow(24, { hour: 23, minute: 0 })).toBe('open');
    expect(checkInWindow(24, { hour: 0, minute: 30 })).toBe('open');
    expect(checkInWindow(24, { hour: 1, minute: 0 })).toBe('late');

    // Slot at 25:00 (01:00 AM). Opens at 00:00, closes at 02:00
    expect(checkInWindow(25, { hour: 23, minute: 59 })).toBe('early');
    expect(checkInWindow(25, { hour: 0, minute: 0 })).toBe('open');
    expect(checkInWindow(25, { hour: 1, minute: 30 })).toBe('open');
    expect(checkInWindow(25, { hour: 2, minute: 0 })).toBe('late');
  });
  test('handles custom slot lengths', () => {
    // 30 minute slot at 18:00 (ends at 18:30)
    expect(checkInWindow(18, { hour: 18, minute: 29 }, 30)).toBe('open');
    expect(checkInWindow(18, { hour: 18, minute: 30 }, 30)).toBe('late');

    // 90 minute slot at 18:00 (ends at 19:30)
    expect(checkInWindow(18, { hour: 19, minute: 15 }, 90)).toBe('open');
    expect(checkInWindow(18, { hour: 19, minute: 30 }, 90)).toBe('late');
  });
});
