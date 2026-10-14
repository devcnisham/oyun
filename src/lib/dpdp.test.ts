import { describe, expect, test } from 'vitest';
import { makeDb, makeBooking } from '@/test/fixtures';
import {
  cleanPhone,
  extractUserData,
  applyUserDeletion,
  applyRetentionPurge,
} from './dpdp';
import { createPlayer } from './wallet';

describe('DPDP Compliance & Data Rights', () => {
  test('cleanPhone validates 10 digits and throws on invalid', () => {
    expect(cleanPhone('9876543210')).toBe('9876543210');
    expect(cleanPhone('+91 98765-43210')).toBe('9876543210');
    expect(() => cleanPhone('12345')).toThrow('valid 10-digit mobile number');
    expect(() => cleanPhone('invalid')).toThrow('valid 10-digit mobile number');
  });

  test('extractUserData returns complete player data package', () => {
    const { db, turf } = makeDb();
    const phone = '9876543210';
    const player = createPlayer(db, 'Test Player', phone);
    db.players.push(player);

    const booking = makeBooking({
      code: 'BK-1001',
      turfId: turf.id,
      customerName: 'Test Player',
      customerPhone: phone,
      playerId: player.id,
      review: {
        rating: 5,
        comment: 'Great pitch!',
        name: 'Test P.',
        createdAt: '2026-10-14T11:00:00.000Z',
        hidden: false,
      },
    });
    db.bookings.push(booking);

    const data = extractUserData(db, phone);
    expect(data.phone).toBe(phone);
    expect(data.player?.id).toBe(player.id);
    expect(data.bookings).toHaveLength(1);
    expect(data.bookings[0].code).toBe('BK-1001');
    expect(data.reviews).toHaveLength(1);
    expect(data.reviews[0].review.comment).toBe('Great pitch!');
    expect(data.regulation).toContain('Digital Personal Data Protection Act');
  });

  test('applyUserDeletion removes player and anonymizes bookings & reviews', () => {
    const { db, turf } = makeDb();
    const phone = '9876543210';
    const player = createPlayer(db, 'Erasure Test', phone);
    db.players.push(player);

    const booking = makeBooking({
      code: 'BK-1002',
      turfId: turf.id,
      customerName: 'Erasure Test',
      customerPhone: phone,
      playerId: player.id,
      review: {
        rating: 4,
        comment: 'Loved the turf.',
        name: 'Erasure T.',
        createdAt: '2026-10-14T11:00:00.000Z',
        hidden: false,
      },
    });
    db.bookings.push(booking);

    const result = applyUserDeletion(db, phone);
    expect(result.bookingsAnonymized).toBe(1);
    expect(result.reviewsAnonymized).toBe(1);

    // Player record removed
    expect(db.players.find((p) => p.phone === phone)).toBeUndefined();

    // Booking kept for tax/audit but PII scrubbed
    const anonymized = db.bookings.find((b) => b.code === 'BK-1002')!;
    expect(anonymized.customerName).toBe('Deleted Player');
    expect(anonymized.customerPhone).toBe('0000000000');
    expect(anonymized.playerId).toBeNull();

    // Review name scrubbed
    expect(anonymized.review?.name).toBe('Verified Player');
  });

  test('applyRetentionPurge purges expired holds and archives ancient bookings', () => {
    const { db, turf } = makeDb();
    const nowIso = '2026-10-14T12:00:00.000Z';

    db.holds = [
      {
        id: 'h-active',
        turfId: turf.id,
        date: '2026-10-14',
        hour: 20,
        holder: 'active-user',
        expiresAt: '2026-10-14T12:15:00.000Z',
      },
      {
        id: 'h-expired',
        turfId: turf.id,
        date: '2026-10-14',
        hour: 18,
        holder: 'expired-user',
        expiresAt: '2026-10-14T11:50:00.000Z',
      },
    ];

    const ancientBooking = makeBooking({
      id: 'b-ancient',
      code: 'BK-OLD',
      turfId: turf.id,
      customerName: 'Ancient Customer',
      customerPhone: '9876543210',
      createdAt: '2016-01-01T10:00:00.000Z',
    });
    db.bookings.push(ancientBooking);

    const purgeResult = applyRetentionPurge(db, { nowIso, maxAgeDays: 365 * 8 });
    expect(purgeResult.holdsPurged).toBe(1);
    expect(db.holds.map((h) => h.id)).toEqual(['h-active']);

    expect(purgeResult.oldBookingsAnonymized).toBe(1);
    const updatedAncient = db.bookings.find((b) => b.id === 'b-ancient')!;
    expect(updatedAncient.customerPhone).toBe('0000000000');
    expect(updatedAncient.customerName).toBe('Archived Customer');
  });
});
