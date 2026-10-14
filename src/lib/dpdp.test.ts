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

  test('extractUserData returns the signed-in account\'s data package', () => {
    const { db, turf } = makeDb();
    const phone = '9876543210';
    const player = createPlayer(db, 'Test Player', phone, null, 'user_A');
    db.players.push(player);

    db.bookings.push(
      makeBooking({
        code: 'BK-1001',
        turfId: turf.id,
        customerName: 'Test Player',
        customerPhone: phone,
        playerId: player.id,
        accountId: 'user_A',
        review: { rating: 5, comment: 'Great pitch!', name: 'Test P.', createdAt: '2026-10-14T11:00:00.000Z', hidden: false },
      })
    );

    const data = extractUserData(db, 'user_A');
    expect(data.accountId).toBe('user_A');
    expect(data.phone).toBe(phone);
    expect(data.player?.id).toBe(player.id);
    expect(data.bookings).toHaveLength(1);
    expect(data.bookings[0].code).toBe('BK-1001');
    expect(data.reviews[0].review.comment).toBe('Great pitch!');
    expect(data.regulation).toContain('Digital Personal Data Protection Act');
  });

  test('another account, or the same phone typed by a stranger, gets none of it', () => {
    const { db, turf } = makeDb();
    const player = createPlayer(db, 'Owner Of Data', '9876543210', null, 'user_A');
    db.players.push(player);
    db.bookings.push(
      makeBooking({ code: 'BK-2001', turfId: turf.id, customerName: 'Owner Of Data', customerPhone: '9876543210', playerId: player.id, accountId: 'user_A' })
    );

    const playersBefore = db.players.length;
    const other = extractUserData(db, 'user_B');
    expect(other.player).toBeNull();
    expect(other.bookings).toHaveLength(0);
    expect(other.walletTransactions).toHaveLength(0);

    // A stranger's erasure must leave the other account's records exactly as they were
    const result = applyUserDeletion(db, 'user_B');
    expect(result.bookingsAnonymized).toBe(0);
    expect(db.players).toHaveLength(playersBefore);
    expect(db.bookings[0].customerName).toBe('Owner Of Data');
  });

  test('an empty account id is refused', () => {
    const { db } = makeDb();
    expect(() => extractUserData(db, '')).toThrow('Sign in');
    expect(() => applyUserDeletion(db, '')).toThrow('Sign in');
  });

  test('applyUserDeletion removes the account\'s player and anonymizes its bookings and reviews', () => {
    const { db, turf } = makeDb();
    const phone = '9876543210';
    const player = createPlayer(db, 'Erasure Test', phone, null, 'user_A');
    db.players.push(player);

    db.bookings.push(
      makeBooking({
        code: 'BK-1002',
        turfId: turf.id,
        customerName: 'Erasure Test',
        customerPhone: phone,
        playerId: player.id,
        accountId: 'user_A',
        review: { rating: 4, comment: 'Loved the turf.', name: 'Erasure T.', createdAt: '2026-10-14T11:00:00.000Z', hidden: false },
      })
    );

    const result = applyUserDeletion(db, 'user_A');
    expect(result.bookingsAnonymized).toBe(1);
    expect(result.reviewsAnonymized).toBe(1);
    expect(db.players.find((p) => p.id === player.id)).toBeUndefined();

    // Booking kept for tax/audit but PII scrubbed
    const anonymized = db.bookings.find((b) => b.code === 'BK-1002')!;
    expect(anonymized.customerName).toBe('Deleted Player');
    expect(anonymized.customerPhone).toBe('0000000000');
    expect(anonymized.playerId).toBeNull();
    expect(anonymized.accountId).toBeNull();
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
