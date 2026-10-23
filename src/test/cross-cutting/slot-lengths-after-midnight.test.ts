import { describe, expect, test } from 'vitest';
import {
  formatSlotRange,
  formatTime,
  isSlotInPast,
  parseMinute,
  slotTimestamp,
} from '@/modules/shared/lib/time';
import { checkInWindow } from '@/modules/partner/lib/checkin-window';
import { turfHours } from '@/modules/shared/lib/pricing';
import { describeHours, SESSIONS } from '@/app/(main)/arenas/[id]/booking-format';
import { buildDayAcrossCourts, buildWeek } from '@/modules/partner/lib/calendar';
import { makeDb } from '@/test/fixtures';

describe('R009 - Slot formatting & arbitrary durations', () => {
  test('formatTime formats whole hours and minutes in 12-hour AM/PM', () => {
    expect(formatTime(6, 0)).toBe('06:00 AM');
    expect(formatTime(12, 0)).toBe('12:00 PM');
    expect(formatTime(18, 30)).toBe('06:30 PM');
    expect(formatTime(23, 45)).toBe('11:45 PM');
    expect(formatTime(0, 0)).toBe('12:00 AM');
    expect(formatTime(1, 15)).toBe('01:15 AM');
  });

  test('formatSlotRange supports standard 60-min and custom slot durations', () => {
    // 60-min standard
    expect(formatSlotRange(18, 60, 0)).toBe('06:00 PM – 07:00 PM');
    // 30-min pickleball
    expect(formatSlotRange(18, 30, 0)).toBe('06:00 PM – 06:30 PM');
    expect(formatSlotRange(18, 30, 30)).toBe('06:30 PM – 07:00 PM');
    // 45-min slot
    expect(formatSlotRange(19, 45, 0)).toBe('07:00 PM – 07:45 PM');
    // 90-min box cricket
    expect(formatSlotRange(20, 90, 0)).toBe('08:00 PM – 09:30 PM');
    // 120-min match
    expect(formatSlotRange(16, 120, 0)).toBe('04:00 PM – 06:00 PM');
  });

  test('formatSlotRange handles midnight and after-midnight transitions cleanly', () => {
    // Cross midnight: 11:00 PM to 12:00 AM
    expect(formatSlotRange(23, 60, 0)).toBe('11:00 PM – 12:00 AM');
    // Cross midnight with minutes: 11:30 PM to 01:00 AM
    expect(formatSlotRange(23, 90, 30)).toBe('11:30 PM – 01:00 AM');
    // Midnight to 1 AM
    expect(formatSlotRange(0, 60, 0)).toBe('12:00 AM – 01:00 AM');
    // 1 AM to 2 AM
    expect(formatSlotRange(1, 60, 0)).toBe('01:00 AM – 02:00 AM');
  });

  test('parseMinute extracts minute component accurately', () => {
    expect(parseMinute('18:30')).toBe(30);
    expect(parseMinute('06:00')).toBe(0);
    expect(parseMinute('invalid')).toBe(0);
  });
});

describe('R009 - Operating hours spanning after-midnight', () => {
  test('turfHours handles daytime venue (06:00 to 23:00)', () => {
    const { turf } = makeDb({ openTime: '06:00', closeTime: '23:00' });
    expect(turfHours(turf)).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]);
  });

  test('turfHours handles venue open until midnight (18:00 to 00:00)', () => {
    const { turf } = makeDb({ openTime: '18:00', closeTime: '00:00' });
    expect(turfHours(turf)).toEqual([18, 19, 20, 21, 22, 23]);
  });

  test('turfHours handles venue open past midnight into early morning (16:00 to 02:00)', () => {
    const { turf } = makeDb({ openTime: '16:00', closeTime: '02:00' });
    // Should output afternoon/night hours followed by after-midnight hours in operating sequence
    expect(turfHours(turf)).toEqual([16, 17, 18, 19, 20, 21, 22, 23, 0, 1]);
  });

  test('turfHours handles 24-hour venue (00:00 to 00:00)', () => {
    const { turf } = makeDb({ openTime: '00:00', closeTime: '00:00' });
    expect(turfHours(turf)).toEqual(Array.from({ length: 24 }, (_, i) => i));
  });
});

describe('R009 - Cross-midnight past slot determination (isSlotInPast)', () => {
  const openHour = 16; // Venue open 16:00 to 02:00

  test('evening slots on the same day before current time are past', () => {
    const now = { date: '2026-10-15', hour: 19, minute: 30 };
    expect(isSlotInPast('2026-10-15', 18, now, openHour, false, 0, 60)).toBe(true);
    expect(isSlotInPast('2026-10-15', 20, now, openHour, false, 0, 60)).toBe(false);
  });

  test('after-midnight slots (00:00 and 01:00) viewed at 22:00 on the operating day are NOT in the past', () => {
    const now = { date: '2026-10-15', hour: 22, minute: 0 };
    // Midnight slot belongs to next morning (2026-10-16 00:00)
    expect(isSlotInPast('2026-10-15', 0, now, openHour, false, 0, 60)).toBe(false);
    expect(isSlotInPast('2026-10-15', 1, now, openHour, false, 0, 60)).toBe(false);
  });

  test('after-midnight slots viewed after midnight on calendar day', () => {
    const now = { date: '2026-10-16', hour: 0, minute: 30 };
    // 00:00 slot has started at 00:00, so it is in the past for online booking
    expect(isSlotInPast('2026-10-15', 0, now, openHour, false, 0, 60)).toBe(true);
    // 00:00 slot is still active for walk-in until 01:00
    expect(isSlotInPast('2026-10-15', 0, now, openHour, true, 0, 60)).toBe(false);
    // 01:00 slot starts at 01:00, so it is still upcoming
    expect(isSlotInPast('2026-10-15', 1, now, openHour, false, 0, 60)).toBe(false);
  });

  test('entire operating session is past after closing next morning', () => {
    const now = { date: '2026-10-16', hour: 3, minute: 0 };
    expect(isSlotInPast('2026-10-15', 23, now, openHour, false, 0, 60)).toBe(true);
    expect(isSlotInPast('2026-10-15', 0, now, openHour, false, 0, 60)).toBe(true);
    expect(isSlotInPast('2026-10-15', 1, now, openHour, false, 0, 60)).toBe(true);
  });
});

describe('R009 - Calendar & ISO timestamps (slotTimestamp)', () => {
  test('slotTimestamp advances date for after-midnight slots', () => {
    const openHour = 18;
    expect(slotTimestamp('2026-10-15', 23, openHour, 0)).toBe('2026-10-15T23:00:00+05:30');
    expect(slotTimestamp('2026-10-15', 0, openHour, 0)).toBe('2026-10-16T00:00:00+05:30');
    expect(slotTimestamp('2026-10-15', 1, openHour, 30)).toBe('2026-10-16T01:30:00+05:30');
  });

  test('buildWeek and buildDayAcrossCourts handle after-midnight rows without crashing', () => {
    const { db, turf } = makeDb({ openTime: '18:00', closeTime: '02:00' });
    const now = { date: '2026-10-15', hour: 20 };
    const week = buildWeek(db, turf, '2026-10-15', now);
    expect(week.hours).toEqual([18, 19, 20, 21, 22, 23, 0, 1]);

    const dayView = buildDayAcrossCourts(db, turf, '2026-10-15', now);
    expect(dayView.hours).toEqual([18, 19, 20, 21, 22, 23, 0, 1]);
    expect(dayView.rows).toHaveLength(8);

    // 00:00 and 01:00 should not be marked 'past' when viewing at 20:00
    const row0 = dayView.rows.find((r) => r.hour === 0);
    expect(row0?.cells[0].state).toBe('free');
  });
});

describe('R009 - Check-in window with cross-midnight support', () => {
  const openHour = 16;

  test('standard check-in opens 60 mins early and closes when slot ends', () => {
    expect(checkInWindow(18, { hour: 16, minute: 59 }, 60, 0, openHour)).toBe('early');
    expect(checkInWindow(18, { hour: 17, minute: 0 }, 60, 0, openHour)).toBe('open');
    expect(checkInWindow(18, { hour: 18, minute: 30 }, 60, 0, openHour)).toBe('open');
    expect(checkInWindow(18, { hour: 19, minute: 0 }, 60, 0, openHour)).toBe('late');
  });

  test('custom 30-min duration check-in closes after 30 mins', () => {
    expect(checkInWindow(18, { hour: 18, minute: 25 }, 30, 0, openHour)).toBe('open');
    expect(checkInWindow(18, { hour: 18, minute: 30 }, 30, 0, openHour)).toBe('late');
  });

  test('midnight slot check-in is open before midnight (e.g. 23:15 on preceding night)', () => {
    // 45 minutes before 00:00 game
    expect(checkInWindow(0, { hour: 23, minute: 15 }, 60, 0, openHour)).toBe('open');
    // 75 minutes before 00:00 game (early)
    expect(checkInWindow(0, { hour: 22, minute: 40 }, 60, 0, openHour)).toBe('early');
    // During the game (00:30)
    expect(checkInWindow(0, { hour: 0, minute: 30 }, 60, 0, openHour)).toBe('open');
    // After the game (01:00)
    expect(checkInWindow(0, { hour: 1, minute: 0 }, 60, 0, openHour)).toBe('late');
  });
});

describe('R009 - UI & Grid helpers (describeHours & SESSIONS)', () => {
  test('describeHours describes cross-midnight consecutive hours correctly', () => {
    // 11 PM to 1 AM across midnight
    expect(describeHours([23, 0], 16)).toBe('11 PM – 1 AM');
    // 10 PM to 2 AM
    expect(describeHours([22, 23, 0, 1], 16)).toBe('10 PM – 2 AM');
    // Daytime consecutive
    expect(describeHours([18, 19, 20])).toBe('6 PM – 9 PM');
  });

  test('SESSIONS contains Late Night group for after-midnight slots', () => {
    const lateNight = SESSIONS.find((s) => s.name === 'Late Night');
    expect(lateNight).toBeDefined();
    expect(lateNight?.from).toBe(0);
    expect(lateNight?.to).toBe(6);
  });
});
