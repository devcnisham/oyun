import { describe, expect, test } from 'vitest';
import { MONDAY, makeBooking, makeDb } from '@/test/fixtures';
import { buildDayAcrossCourts, buildWeek, weekStart } from './calendar';

const NOW = { date: '2026-10-14', hour: 10 }; // a Wednesday

describe('weekStart', () => {
  test('is the Monday on or before the date', () => {
    expect(weekStart('2026-10-12')).toBe('2026-10-12'); // Monday
    expect(weekStart('2026-10-14')).toBe('2026-10-12'); // Wednesday
    expect(weekStart('2026-10-18')).toBe('2026-10-12'); // Sunday belongs to the week that began Monday
    expect(weekStart('2026-10-19')).toBe('2026-10-19');
  });
});

describe('buildWeek', () => {
  test('seven days of every opening hour, today marked', () => {
    const { db, turf } = makeDb({ openTime: '06:00', closeTime: '10:00' });
    const { hours, days } = buildWeek(db, turf, MONDAY, NOW);
    expect(hours).toEqual([6, 7, 8, 9]);
    expect(days.map((d) => d.date)).toEqual(['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18']);
    expect(days.filter((d) => d.isToday).map((d) => d.date)).toEqual(['2026-10-14']);
    expect(days.every((d) => d.cells.length === 4)).toBe(true);
  });

  test('past hours are past, later hours free', () => {
    const { db, turf } = makeDb({ openTime: '06:00', closeTime: '12:00' });
    const { days } = buildWeek(db, turf, MONDAY, NOW);
    const state = (date: string, hour: number) => days.find((d) => d.date === date)!.cells.find((c) => c.hour === hour)!.state;
    expect(state('2026-10-13', 7)).toBe('past'); // yesterday
    expect(state('2026-10-14', 9)).toBe('past'); // earlier today
    expect(state('2026-10-14', 10)).toBe('free'); // the hour that has started still counts as open
    expect(state('2026-10-15', 6)).toBe('free');
  });

  test('bookings, blocks and live holds show; cancelled bookings and expired holds do not', () => {
    const { db, turf } = makeDb();
    db.bookings.push(
      makeBooking({ date: '2026-10-15', hour: 18, customerName: 'Asha', pitch: 'A' }),
      makeBooking({ date: '2026-10-15', hour: 18, customerName: 'Ravi', pitch: 'B' }),
      makeBooking({ date: '2026-10-15', hour: 19, status: 'cancelled' }),
      makeBooking({ date: '2026-10-15', hour: 20, status: 'no_show' }),
      makeBooking({ turfId: 'turf_other', date: '2026-10-15', hour: 21 })
    );
    db.blocks.push({ id: 'blk', turfId: turf.id, date: '2026-10-16', hour: 7, reason: 'nets repair', createdBy: 'Owner', createdAt: '' });
    db.holds.push({ id: 'h1', turfId: turf.id, date: '2026-10-16', hour: 8, holder: 'x', expiresAt: new Date(Date.now() + 60_000).toISOString() });
    db.holds.push({ id: 'h2', turfId: turf.id, date: '2026-10-16', hour: 9, holder: 'x', expiresAt: new Date(Date.now() - 60_000).toISOString() });

    const { days } = buildWeek(db, turf, MONDAY, NOW);
    const cell = (date: string, hour: number) => days.find((d) => d.date === date)!.cells.find((c) => c.hour === hour)!;

    expect(cell('2026-10-15', 18)).toMatchObject({ state: 'booked' });
    expect(cell('2026-10-15', 18).bookings.map((b) => [b.name, b.part])).toEqual([['Asha', 'A'], ['Ravi', 'B']]);
    expect(cell('2026-10-15', 19).state).toBe('free');
    expect(cell('2026-10-15', 20).bookings[0].status).toBe('no_show');
    expect(cell('2026-10-15', 21).state).toBe('free'); // another turf's booking
    expect(cell('2026-10-16', 7)).toMatchObject({ state: 'blocked', blockReason: 'nets repair', blockId: 'blk' });
    expect(cell('2026-10-16', 8).state).toBe('held');
    expect(cell('2026-10-16', 9).state).toBe('free');
    expect(days.find((d) => d.date === '2026-10-15')!.booked).toBe(3);
  });
});

describe('buildDayAcrossCourts (P7-45, R007)', () => {
  test('multi-court / split-pitch day view maps bookings to individual courts', () => {
    const { db, turf } = makeDb({ halfPitch: true });
    db.bookings.push(
      makeBooking({ turfId: turf.id, date: '2026-10-15', hour: 18, customerName: 'Asha', pitch: 'A' }),
      makeBooking({ turfId: turf.id, date: '2026-10-15', hour: 18, customerName: 'Ravi', pitch: 'B' }),
      makeBooking({ turfId: turf.id, date: '2026-10-15', hour: 19, customerName: 'Full Team', pitch: 'full' })
    );

    const { resources, rows } = buildDayAcrossCourts(db, turf, '2026-10-15', NOW);
    expect(resources).toHaveLength(2);
    expect(resources[0].name).toBe('Pitch Half A');
    expect(resources[1].name).toBe('Pitch Half B');

    const row18 = rows.find((r) => r.hour === 18)!;
    expect(row18.cells[0].bookings.map((b) => b.name)).toEqual(['Asha']);
    expect(row18.cells[1].bookings.map((b) => b.name)).toEqual(['Ravi']);

    const row19 = rows.find((r) => r.hour === 19)!;
    // Full pitch booking occupies both halves
    expect(row19.cells[0].bookings.map((b) => b.name)).toEqual(['Full Team']);
    expect(row19.cells[1].bookings.map((b) => b.name)).toEqual(['Full Team']);
  });
});
