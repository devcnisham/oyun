import { describe, expect, test } from 'vitest';
import { makeDb } from '@/test/fixtures';
import type { BookingRequest } from '@/modules/web/lib/booking-types';
import { planBooking } from '@/modules/web/lib/booking-plan';
import { buildQuote } from '@/modules/shared/lib/pricing';
import { createPlayer } from '@/modules/shared/lib/wallet';
import { istNow } from '@/modules/shared/lib/time';

describe('P9-03: Clerk Identity & Wallet Binding', () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const makeReq = (turfId: string, over: Partial<BookingRequest> = {}): BookingRequest => ({
    turfId,
    date: tomorrow,
    hours: [18],
    promoCode: null,
    addOns: [],
    useWallet: false,
    phone: '9876543210',
    name: 'Player',
    ...over,
  });

  test('planBooking creates a player tied to accountId', () => {
    const { db, turf } = makeDb();
    const accountId = 'user_clerk_123';
    const phone = '9876543210';

    const { bookings } = planBooking(
      db,
      makeReq(turf.id, {
        hours: [18],
        phone,
        name: 'Clerk Player',
      }),
      null,
      false,
      accountId
    );

    expect(bookings).toHaveLength(1);
    expect(bookings[0].accountId).toBe(accountId);

    const player = db.players.find((p) => p.phone === phone);
    expect(player).toBeDefined();
    expect(player?.accountId).toBe(accountId);
  });

  test('planBooking binds an existing player without accountId to accountId on login', () => {
    const { db, turf } = makeDb();
    const phone = '9876543211';
    const player = createPlayer(db, 'Legacy Player', phone);
    expect(player.accountId).toBeNull();

    const accountId = 'user_clerk_456';
    planBooking(
      db,
      makeReq(turf.id, {
        hours: [19],
        phone,
        name: 'Legacy Player',
      }),
      null,
      false,
      accountId
    );

    expect(player.accountId).toBe(accountId);
  });

  test('planBooking rejects booking when phone belongs to a different Clerk account', () => {
    const { db, turf } = makeDb();
    const phone = '9876543212';
    createPlayer(db, 'Owner Player', phone, null, 'user_clerk_original');

    expect(() =>
      planBooking(
        db,
        makeReq(turf.id, {
          hours: [20],
          phone,
          name: 'Imposter Player',
        }),
        null,
        false,
        'user_clerk_imposter'
      )
    ).toThrow('belongs to another registered account');
  });

  test('buildQuote blocks wallet spend when caller is unauthenticated or has different accountId', () => {
    const { db, turf } = makeDb();
    const phone = '9876543213';
    const player = createPlayer(db, 'Rich Player', phone, null, 'user_clerk_secure');
    player.walletBalance = 500;

    const now = istNow();

    // 1. Caller with matching accountId gets wallet deduction
    const authQuote = buildQuote(
      db,
      {
        turfId: turf.id,
        date: tomorrow,
        hour: 18,
        phone,
        accountId: 'user_clerk_secure',
        useWallet: true,
      },
      now
    );
    expect(authQuote?.breakdown.walletDeduction).toBeGreaterThan(0);

    // 2. Caller without accountId (spoofed phone) gets 0 wallet deduction
    const unauthQuote = buildQuote(
      db,
      {
        turfId: turf.id,
        date: tomorrow,
        hour: 18,
        phone,
        accountId: null,
        useWallet: true,
      },
      now
    );
    expect(unauthQuote?.breakdown.walletDeduction).toBe(0);

    // 3. Caller with different accountId gets 0 wallet deduction
    const wrongAccountQuote = buildQuote(
      db,
      {
        turfId: turf.id,
        date: tomorrow,
        hour: 18,
        phone,
        accountId: 'user_clerk_different',
        useWallet: true,
      },
      now
    );
    expect(wrongAccountQuote?.breakdown.walletDeduction).toBe(0);
  });
});
