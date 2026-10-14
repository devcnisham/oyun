import { describe, expect, it } from 'vitest';
import { addDays, dayOfWeek, formatDate, formatHour, formatSlotRange, formatTime, isWeekend, isValidDate, parseHour } from './time';

describe('time utilities', () => {
  it('formats whole hours including 24 and after-midnight', () => {
    expect(formatHour(0)).toBe('12:00 AM');
    expect(formatHour(9)).toBe('09:00 AM');
    expect(formatHour(12)).toBe('12:00 PM');
    expect(formatHour(18)).toBe('06:00 PM');
    expect(formatHour(23)).toBe('11:00 PM');
    expect(formatHour(24)).toBe('12:00 AM');
    expect(formatHour(25)).toBe('01:00 AM');
    expect(formatHour(26)).toBe('02:00 AM');
  });

  it('formats arbitrary time with minutes and after-midnight hours', () => {
    expect(formatTime(10, 30)).toBe('10:30 AM');
    expect(formatTime(18, 45)).toBe('06:45 PM');
    expect(formatTime(24, 15)).toBe('12:15 AM');
    expect(formatTime(25, 30)).toBe('01:30 AM');
  });

  it('formats slot ranges for default 60min and custom durations', () => {
    expect(formatSlotRange(18)).toBe('06:00 PM – 07:00 PM');
    // 30 minute slot
    expect(formatSlotRange(18, 30)).toBe('06:00 PM – 06:30 PM');
    // 90 minute slot
    expect(formatSlotRange(18, 90)).toBe('06:00 PM – 07:30 PM');
    // After midnight 60m
    expect(formatSlotRange(24)).toBe('12:00 AM – 01:00 AM');
    expect(formatSlotRange(25)).toBe('01:00 AM – 02:00 AM');
    // After midnight 30m
    expect(formatSlotRange(24, 30)).toBe('12:00 AM – 12:30 AM');
  });

  it('parses hours and validates dates', () => {
    expect(parseHour('18:00')).toBe(18);
    expect(parseHour('02:00')).toBe(2);
    expect(isValidDate('2026-10-15')).toBe(true);
    expect(isValidDate('2026-02-31')).toBe(false);
    expect(isValidDate('invalid')).toBe(false);
  });

  it('calculates addDays, dayOfWeek, and weekend', () => {
    expect(addDays('2026-10-15', 1)).toBe('2026-10-16');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    // 2026-10-18 is a Sunday (0)
    expect(dayOfWeek('2026-10-18')).toBe(0);
    expect(isWeekend('2026-10-18')).toBe(true);
    // 2026-10-15 is a Thursday (4)
    expect(dayOfWeek('2026-10-15')).toBe(4);
    expect(isWeekend('2026-10-15')).toBe(false);
  });

  it('formats dates consistently', () => {
    expect(formatDate('2026-10-15')).toContain('15');
    expect(formatDate('2026-10-15')).toContain('Oct');
  });
});
