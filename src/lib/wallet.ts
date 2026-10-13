import { randomBytes } from 'node:crypto';
import type { Booking, Database, Player, WalletTxnType } from './types';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomChars(n: number) {
  return Array.from(randomBytes(n), (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
}

// e.g. "RAHUL7K2" — first name plus 3 random characters
export function newReferralCode(db: Database, name: string) {
  const base = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) || 'PLAY';
  for (;;) {
    const code = base + randomChars(3);
    if (!db.players.some((p) => p.referralCode === code)) return code;
  }
}

export function findByReferralCode(db: Database, code: string | null | undefined) {
  const c = code?.trim().toUpperCase();
  return c ? db.players.find((p) => p.referralCode === c) : undefined;
}

export function findByAccountId(db: Database, accountId: string | null | undefined): Player | undefined {
  if (!accountId) return undefined;
  return db.players.find((p) => p.accountId === accountId);
}

export function createPlayer(db: Database, name: string, phone: string, referredBy: string | null = null, accountId: string | null = null): Player {
  const player: Player = {
    id: `player_${randomBytes(6).toString('hex')}`,
    name,
    phone,
    walletBalance: 0,
    status: 'active',
    referralCode: newReferralCode(db, name),
    referredBy,
    referralRewarded: false,
    accountId: accountId ?? null,
    createdAt: new Date().toISOString(),
  };
  db.players.push(player);
  return player;
}

// Every wallet change goes through here so the history always matches the balance
export function walletTxn(db: Database, player: Player, amount: number, type: WalletTxnType, note: string, bookingId: string | null = null) {
  if (amount === 0) return;
  player.walletBalance += amount;
  db.walletTxns.push({
    id: `wtx_${randomBytes(6).toString('hex')}`,
    playerId: player.id,
    amount,
    type,
    note,
    bookingId,
    createdAt: new Date().toISOString(),
  });
}

// What goes back to the wallet when a booking is cancelled or refunded: money that was really paid in.
// That is wallet credit used at booking, plus an amount paid up front, but not a 'advance' booking's amountPaid,
// which was only recorded (nothing was charged online).
export function refundDue(booking: Booking) {
  return (booking.paymentMode === 'advance' ? 0 : booking.amountPaid) + (booking.pricing.walletDeduction ?? 0);
}

export function cashbackFor(db: Database, booking: Booking) {
  const s = db.settings;
  if (!s.cashbackEnabled || s.cashbackPercent <= 0) return 0;
  return Math.min(s.cashbackMax, Math.floor((booking.pricing.total * s.cashbackPercent) / 100));
}

// Called when a booking is checked in: cashback for the game, plus referral credit on a referred player's first game
export function rewardCheckIn(db: Database, booking: Booking): string[] {
  const notes: string[] = [];
  const player = booking.playerId ? db.players.find((p) => p.id === booking.playerId) : undefined;
  if (!player || player.status !== 'active') return notes;
  const turf = db.turfs.find((t) => t.id === booking.turfId);

  if (!booking.cashback) {
    const cashback = cashbackFor(db, booking);
    if (cashback > 0) {
      walletTxn(db, player, cashback, 'cashback', `Cashback for your game at ${turf?.name ?? 'the turf'}`, booking.id);
      booking.cashback = cashback;
      notes.push(`₹${cashback} cashback added to ${player.name}'s wallet`);
    }
  }

  if (db.settings.referralEnabled && player.referredBy && !player.referralRewarded) {
    const referrer = db.players.find((p) => p.id === player.referredBy);
    player.referralRewarded = true;
    walletTxn(db, player, db.settings.refereeReward, 'referral_bonus', 'Welcome bonus for joining with a referral code', booking.id);
    if (referrer && referrer.status === 'active') {
      walletTxn(db, referrer, db.settings.referrerReward, 'referral', `${player.name} played their first game with your code`, booking.id);
    }
    notes.push('referral rewards paid');
  }
  return notes;
}

export const WALLET_TXN_LABELS: Record<WalletTxnType, string> = {
  cashback: 'Cashback',
  referral: 'Referral reward',
  referral_bonus: 'Referral welcome bonus',
  refund: 'Refund',
  booking_payment: 'Used for booking',
  admin_adjust: 'Adjustment by OYUN',
};
