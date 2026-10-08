import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { canSelfCancel } from './cancel-policy';

// Slot at 18:00 IST on 12 Oct 2026 = 12:30 UTC
const slot = { status: 'confirmed', source: 'online', date: '2026-10-12', hour: 18 } as const;
const at = (iso: string) => vi.setSystemTime(new Date(iso));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('a player can cancel up to exactly 2 hours before the slot', () => {
  at('2026-10-12T10:30:00Z'); // 16:00 IST
  expect(canSelfCancel(slot)).toBe(true);
  at('2026-10-12T10:30:01Z');
  expect(canSelfCancel(slot)).toBe(false);
});

test('walk-ins and bookings that are not confirmed cannot be self-cancelled', () => {
  at('2026-10-10T00:00:00Z');
  expect(canSelfCancel({ ...slot, source: 'walk_in' })).toBe(false);
  for (const status of ['checked_in', 'no_show', 'cancelled', 'refunded'] as const) {
    expect(canSelfCancel({ ...slot, status })).toBe(false);
  }
});

test('a slot that already started cannot be cancelled', () => {
  at('2026-10-12T13:00:00Z');
  expect(canSelfCancel(slot)).toBe(false);
});
