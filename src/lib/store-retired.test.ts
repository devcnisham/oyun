import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  RETIRED_JSONB_TABLES,
  isBookingStoreRetired,
  diff,
  changedSlotDays,
  snapshot,
} from './store';
import { seed } from './seed';
import { makeBooking, makePlayer } from '@/test/fixtures';

describe('store jsonb retirement (R008)', () => {
  const origEnv = process.env.RETIRE_JSONB_BOOKINGS;

  beforeEach(() => {
    delete process.env.RETIRE_JSONB_BOOKINGS;
  });

  afterEach(() => {
    if (origEnv !== undefined) {
      process.env.RETIRE_JSONB_BOOKINGS = origEnv;
    } else {
      delete process.env.RETIRE_JSONB_BOOKINGS;
    }
  });

  it('defines the expected set of retired tables', () => {
    expect(RETIRED_JSONB_TABLES.has('bookings')).toBe(true);
    expect(RETIRED_JSONB_TABLES.has('holds')).toBe(true);
    expect(RETIRED_JSONB_TABLES.has('blocks')).toBe(true);
    expect(RETIRED_JSONB_TABLES.has('pricing')).toBe(true);
    expect(RETIRED_JSONB_TABLES.has('players')).toBe(false);
    expect(RETIRED_JSONB_TABLES.has('turfs')).toBe(false);
  });

  it('controls retirement through the RETIRE_JSONB_BOOKINGS env flag', () => {
    process.env.RETIRE_JSONB_BOOKINGS = 'true';
    expect(isBookingStoreRetired()).toBe(true);

    process.env.RETIRE_JSONB_BOOKINGS = 'false';
    expect(isBookingStoreRetired()).toBe(false);
  });

  it('excludes retired tables from diff upserts and deletes when retired', () => {
    process.env.RETIRE_JSONB_BOOKINGS = 'true';
    const db = seed();
    const beforeSnap = snapshot(db);

    // Mutate bookings and pricing only
    db.bookings.push(makeBooking({
      id: 'bk_000000000001',
      turfId: 'turf_test',
      date: '2026-10-20',
      hour: 18,
    }));
    db.pricing['turf_test'] = {
      peakEnabled: false,
      peakStartHour: 18,
      peakEndHour: 22,
      peakPercent: 0,
      weekendEnabled: false,
      weekendPercent: 0,
      lastMinuteEnabled: false,
      lastMinuteHours: 2,
      lastMinutePercent: 0,
    };

    const d = diff(beforeSnap, db);
    expect(d.upserts.bookings).toBeUndefined();
    expect(d.upserts.pricing).toBeUndefined();
    expect(d.empty).toBe(true);

    // Now mutate an active non-retired table (e.g. players)
    db.players.push(makePlayer({
      id: 'pl_000000000001',
      phone: '9876543210',
      name: 'Test Player',
    }));
    const d2 = diff(beforeSnap, db);
    expect(d2.empty).toBe(false);
    expect(d2.upserts.players).toBeDefined();
    expect(d2.upserts.players?.length).toBe(1);
    expect(d2.upserts.bookings).toBeUndefined();
  });

  it('includes bookings in diff when retirement is disabled', () => {
    process.env.RETIRE_JSONB_BOOKINGS = 'false';
    const db = seed();
    const beforeSnap = new Map();
    beforeSnap.set('bookings', new Map());

    db.bookings.push(makeBooking({
      id: 'bk_000000000002',
      turfId: 'turf_test2',
      date: '2026-10-21',
      hour: 19,
    }));

    const d = diff(beforeSnap, db);
    expect(d.empty).toBe(false);
    expect(d.upserts.bookings).toBeDefined();
    expect(d.upserts.bookings?.length).toBe(1);
  });

  it('accurately detects changed slot days from db even when retired', () => {
    process.env.RETIRE_JSONB_BOOKINGS = 'true';
    const db = seed();
    const beforeSnap = new Map();
    beforeSnap.set('bookings', new Map());
    beforeSnap.set('holds', new Map());
    beforeSnap.set('blocks', new Map());

    db.bookings.push(makeBooking({
      id: 'bk_000000000003',
      turfId: 'turf_prime',
      date: '2026-10-22',
      hour: 17,
    }));

    db.holds.push({
      id: 'hold_00000000001',
      turfId: 'turf_city',
      date: '2026-10-23',
      hour: 20,
      holder: 'dev_123',
      expiresAt: '2026-10-15T01:00:00.000Z',
    });

    const changed = changedSlotDays(beforeSnap, db);
    expect(changed).toContainEqual({ turfId: 'turf_prime', date: '2026-10-22' });
    expect(changed).toContainEqual({ turfId: 'turf_city', date: '2026-10-23' });
  });
});
