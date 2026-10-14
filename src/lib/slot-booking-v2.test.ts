import { describe, expect, it } from 'vitest';
import {
  isV2RpcEnabled,
  mapV2RowsToSlots,
  stringToUuid,
  turfBookableUuid,
  type V2SlotRow,
} from './slot-booking-v2';

describe('slot-booking-v2', () => {
  it('generates deterministic RFC 4122 v4-compliant UUIDs', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const u1 = stringToUuid('turf_mangalore_arena');
    const u2 = stringToUuid('turf_mangalore_arena');
    const u3 = stringToUuid('turf_other_arena');

    expect(u1).toMatch(uuidRegex);
    expect(u1).toBe(u2);
    expect(u1).not.toBe(u3);
  });

  it('derives distinct bookable UUIDs for pitch partitions', () => {
    const full = turfBookableUuid('turf_1', 'full');
    const halfA = turfBookableUuid('turf_1', 'half_a');
    const halfB = turfBookableUuid('turf_1', 'half_b');

    expect(full).not.toBe(halfA);
    expect(halfA).not.toBe(halfB);
    expect(full).not.toBe(halfB);
  });

  it('reports disabled in test mode without explicit env flag', () => {
    expect(isV2RpcEnabled()).toBe(false);
  });

  it('maps v2 slot rows into standard application Slot structures with IST time', () => {
    const rows: V2SlotRow[] = [
      {
        starts_at: '2026-10-16T18:00:00+05:30',
        ends_at: '2026-10-16T19:00:00+05:30',
        price: 1200,
        state: 'available',
      },
      {
        starts_at: '2026-10-16T19:00:00+05:30',
        ends_at: '2026-10-16T20:00:00+05:30',
        price: 1500,
        state: 'booked',
      },
      {
        starts_at: '2026-10-16T20:00:00+05:30',
        ends_at: '2026-10-16T20:30:00+05:30',
        price: 750,
        state: 'held',
      },
      {
        starts_at: '2026-10-16T20:30:00+05:30',
        ends_at: '2026-10-16T21:30:00+05:30',
        price: 1500,
        state: 'blocked',
      },
    ];

    const slots = mapV2RowsToSlots(rows, '2026-10-16', 'A');
    expect(slots).toHaveLength(4);

    // Slot 1: Available 18:00-19:00 (60 min)
    expect(slots[0].date).toBe('2026-10-16');
    expect(slots[0].hour).toBe(18);
    expect(slots[0].durationMinutes).toBe(60);
    expect(slots[0].available).toBe(true);
    expect(slots[0].reason).toBeNull();
    expect(slots[0].pitch).toBe('A');
    expect(slots[0].label).toContain('06:00 PM – 07:00 PM');

    // Slot 2: Booked 19:00-20:00
    expect(slots[1].hour).toBe(19);
    expect(slots[1].available).toBe(false);
    expect(slots[1].reason).toBe('booked');

    // Slot 3: Held 20:00-20:30 (30 min)
    expect(slots[2].hour).toBe(20);
    expect(slots[2].durationMinutes).toBe(30);
    expect(slots[2].available).toBe(false);
    expect(slots[2].reason).toBe('held');
    expect(slots[2].label).toContain('08:00 PM – 08:30 PM');

    // Slot 4: Blocked 20:30-21:30
    expect(slots[3].hour).toBe(20);
    expect(slots[3].available).toBe(false);
    expect(slots[3].reason).toBe('blocked');
  });
});
