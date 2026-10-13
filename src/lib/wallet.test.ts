import { describe, expect, test } from 'vitest';
import { makeBooking, makeDb, makePlayer } from '@/test/fixtures';
import { cashbackFor, createPlayer, findByAccountId, findByReferralCode, refundDue, rewardCheckIn, walletTxn } from './wallet';

const balanceFromLedger = (db: ReturnType<typeof makeDb>['db'], playerId: string) =>
  db.walletTxns.filter((t) => t.playerId === playerId).reduce((s, t) => s + t.amount, 0);

describe('wallet ledger', () => {
  test('every change is recorded, so the balance equals the sum of transactions', () => {
    const { db } = makeDb();
    const p = createPlayer(db, 'Rahul', '9876543210');
    walletTxn(db, p, 100, 'cashback', 'a');
    walletTxn(db, p, -40, 'booking_payment', 'b');
    walletTxn(db, p, 0, 'admin_adjust', 'ignored');
    expect(p.walletBalance).toBe(60);
    expect(db.walletTxns).toHaveLength(2);
    expect(balanceFromLedger(db, p.id)).toBe(p.walletBalance);
  });

  test('referral codes are unique and found case-insensitively', () => {
    const { db } = makeDb();
    const a = createPlayer(db, 'Rahul Shetty', '9000000001');
    const b = createPlayer(db, 'Rahul', '9000000002');
    expect(a.referralCode).toMatch(/^RAHUL[A-Z2-9]{3}$/);
    expect(a.referralCode).not.toBe(b.referralCode);
    expect(findByReferralCode(db, ` ${a.referralCode.toLowerCase()} `)?.id).toBe(a.id);
    expect(findByReferralCode(db, '')).toBeUndefined();
  });

  test('players can be linked to and found by accountId', () => {
    const { db } = makeDb();
    const p = createPlayer(db, 'Alice', '9000000003', null, 'clerk_user_123');
    expect(p.accountId).toBe('clerk_user_123');
    expect(findByAccountId(db, 'clerk_user_123')?.id).toBe(p.id);
    expect(findByAccountId(db, 'unknown')).toBeUndefined();
    expect(findByAccountId(db, null)).toBeUndefined();
  });
});

describe('refundDue', () => {
  test('an advance booking returns only the wallet money used (nothing was charged online)', () => {
    const b = makeBooking({ paymentMode: 'advance', amountPaid: 150 });
    b.pricing.walletDeduction = 200;
    expect(refundDue(b)).toBe(200);
  });

  test('a paid-in-full booking returns the amount paid plus wallet money', () => {
    const b = makeBooking({ paymentMode: 'full', amountPaid: 800 });
    b.pricing.walletDeduction = 200;
    expect(refundDue(b)).toBe(1000);
  });
});

describe('check-in rewards', () => {
  const setup = () => {
    const { db } = makeDb();
    Object.assign(db.settings, { cashbackEnabled: true, cashbackPercent: 5, cashbackMax: 100, referralEnabled: true, referrerReward: 100, refereeReward: 50 });
    const referrer = makePlayer({ name: 'Ref' });
    const player = makePlayer({ referredBy: referrer.id });
    db.players.push(referrer, player);
    const booking = makeBooking({ playerId: player.id });
    db.bookings.push(booking);
    return { db, referrer, player, booking };
  };

  test('cashback is a capped percentage and off when disabled', () => {
    const { db, booking } = setup();
    expect(cashbackFor(db, booking)).toBe(50);
    booking.pricing.total = 10_000;
    expect(cashbackFor(db, booking)).toBe(100);
    db.settings.cashbackEnabled = false;
    expect(cashbackFor(db, booking)).toBe(0);
  });

  test('cashback and referral rewards are paid once, even if check-in runs twice', () => {
    const { db, referrer, player, booking } = setup();
    rewardCheckIn(db, booking);
    rewardCheckIn(db, booking);
    expect(player.walletBalance).toBe(50 + 50);
    expect(referrer.walletBalance).toBe(100);
    expect(player.referralRewarded).toBe(true);
    expect(balanceFromLedger(db, player.id)).toBe(player.walletBalance);
  });

  test('a banned player gets nothing', () => {
    const { db, player, booking } = setup();
    player.status = 'banned';
    expect(rewardCheckIn(db, booking)).toEqual([]);
    expect(db.walletTxns).toHaveLength(0);
  });

  test('a banned referrer is not paid, but the new player still is', () => {
    const { db, referrer, player, booking } = setup();
    referrer.status = 'banned';
    rewardCheckIn(db, booking);
    expect(referrer.walletBalance).toBe(0);
    expect(player.walletBalance).toBe(100);
  });
});
