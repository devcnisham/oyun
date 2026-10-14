import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { isOutdoorTurf, getWeatherAlert } from './weather';
import { canSelfCancel } from './cancel-policy';

describe('Weather Alerts and Rain Cancellation Policy', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('isOutdoorTurf identifies indoor vs open-air turfs', () => {
    expect(isOutdoorTurf({ amenities: ['Floodlights', 'Parking'] })).toBe(true);
    expect(isOutdoorTurf({ amenities: ['Covered', 'Parking'] })).toBe(false);
    expect(isOutdoorTurf({ amenities: ['Indoor Arena', 'Changing Rooms'] })).toBe(false);
  });

  test('getWeatherAlert returns active monsoon rain protection for outdoor turfs', () => {
    const outdoorAlert = getWeatherAlert({ amenities: ['Floodlights'] });
    expect(outdoorAlert.active).toBe(true);
    expect(outdoorAlert.rainRefundGuaranteed).toBe(true);
    expect(outdoorAlert.title).toContain('Monsoon Rain Protection');

    const indoorAlert = getWeatherAlert({ amenities: ['Covered'] });
    expect(indoorAlert.active).toBe(false);
    expect(indoorAlert.rainRefundGuaranteed).toBe(false);
  });

  test('canSelfCancel allows rain cancellation up to slot start without 2-hour cutoff', () => {
    // 18:00 IST = 12:30 UTC
    const slot = {
      status: 'confirmed' as const,
      source: 'online' as const,
      date: '2026-10-14',
      hour: 18,
    };

    // Set time to 17:15 IST (11:45 UTC) - 45 mins before slot
    vi.setSystemTime(new Date('2026-10-14T11:45:00Z'));

    // Standard self-cancel is false (within 2 hours)
    expect(canSelfCancel(slot, false)).toBe(false);

    // Weather/rain cancellation is true (slot hasn't started)
    expect(canSelfCancel(slot, true)).toBe(true);

    // After slot starts: 18:01 IST (12:31 UTC)
    vi.setSystemTime(new Date('2026-10-14T12:31:00Z'));
    expect(canSelfCancel(slot, true)).toBe(false);
  });
});
