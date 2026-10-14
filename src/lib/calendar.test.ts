import { describe, expect, test } from 'vitest';
import { MONDAY, makeBooking, makeDb } from '@/test/fixtures';
import { buildDay, buildWeek, weekStart } from './calendar';

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

  test('filters by court when courtFilter is provided', () => {
    const { db, turf } = makeDb({ halfPitch: true });
    db.bookings.push(
      makeBooking({ date: '2026-10-15', hour: 18, customerName: 'Asha', pitch: 'A' }),
      makeBooking({ date: '2026-10-15', hour: 18, customerName: 'Ravi', pitch: 'B' })
    );

    const { days: daysHalfA } = buildWeek(db, turf, MONDAY, NOW, 'Half A');
    const cellA = daysHalfA.find((d) => d.date === '2026-10-15')!.cells.find((c) => c.hour === 18)!;
    expect(cellA.bookings.map((b) => b.name)).toEqual(['Asha']);

    const { days: daysHalfB } = buildWeek(db, turf, MONDAY, NOW, 'Half B');
    const cellB = daysHalfB.find((d) => d.date === '2026-10-15')!.cells.find((c) => c.hour === 18)!;
    expect(cellB.bookings.map((b) => b.name)).toEqual(['Ravi']);
  });
});

describe('buildDay', () => {
  test('builds day view across all courts with pitch partitions', () => {
    const { db, turf } = makeDb({ halfPitch: true, openTime: '06:00', closeTime: '22:00' });
    db.bookings.push(
      makeBooking({ date: '2026-10-15', hour: 18, customerName: 'Asha', pitch: 'A' }),
      makeBooking({ date: '2026-10-15', hour: 19, customerName: 'Ravi', pitch: 'B' }),
      makeBooking({ date: '2026-10-15', hour: 20, customerName: 'Team Match', pitch: 'full' })
    );
    db.blocks.push(
      { id: 'blk1', turfId: turf.id, date: '2026-10-15', hour: 7, pitch: 'A', reason: 'half A maintenance', createdBy: 'Owner', createdAt: '' },
      { id: 'blk2', turfId: turf.id, date: '2026-10-15', hour: 8, reason: 'full tournament setup', createdBy: 'Owner', createdAt: '' }
    );

    const dayView = buildDay(db, turf, '2026-10-15', NOW);
    expect(dayView.date).toBe('2026-10-15');
    expect(dayView.courts.map((c) => c.name)).toEqual(['Half A', 'Half B']);

    // 18:00 -> Asha on Half A, Half B free
    const row18 = dayView.rows.find((r) => r.hour === 18)!;
    const cell18A = row18.cells.find((c) => c.courtName === 'Half A')!;
    const cell18B = row18.cells.find((c) => c.courtName === 'Half B')!;
    expect(cell18A.state).toBe('booked');
    expect(cell18A.bookings[0].name).toBe('Asha');
    expect(cell18B.state).toBe('free');

    // 19:00 -> Half A free, Ravi on Half B
    const row19 = dayView.rows.find((r) => r.hour === 19)!;
    const cell19A = row19.cells.find((c) => c.courtName === 'Half A')!;
    const cell19B = row19.cells.find((c) => c.courtName === 'Half B')!;
    expect(cell19A.state).toBe('free');
    expect(cell19B.state).toBe('booked');
    expect(cell19B.bookings[0].name).toBe('Ravi');

    // 20:00 -> Team Match on both Half A and Half B
    const row20 = dayView.rows.find((r) => r.hour === 20)!;
    const cell20A = row20.cells.find((c) => c.courtName === 'Half A')!;
    const cell20B = row20.cells.find((c) => c.courtName === 'Half B')!;
    expect(cell20A.state).toBe('booked');
    expect(cell20B.state).toBe('booked');
    expect(cell20A.bookings[0].name).toBe('Team Match');
    expect(cell20B.bookings[0].name).toBe('Team Match');

    // 07:00 -> Half A blocked, Half B free
    const row7 = dayView.rows.find((r) => r.hour === 7)!;
    expect(row7.cells.find((c) => c.courtName === 'Half A')!.state).toBe('blocked');
    expect(row7.cells.find((c) => c.courtName === 'Half B')!.state).toBe('free');

    // 08:00 -> Full venue block: both Half A and Half B blocked
    const row8 = dayView.rows.find((r) => r.hour === 8)!;
    expect(row8.cells.find((c) => c.courtName === 'Half A')!.state).toBe('blocked');
    expect(row8.cells.find((c) => c.courtName === 'Half B')!.state).toBe('blocked');
  });
});

