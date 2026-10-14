import { getDb, mutate } from '@/lib/store';
import type { Database, Player, Booking, WalletTxn, BookingReview } from '@/lib/types';
import { ValidationError } from '@/lib/errors';

export interface DataExportPayload {
  regulation: string;
  exportedAt: string;
  phone: string;
  player: Player | null;
  bookings: Booking[];
  walletTransactions: WalletTxn[];
  reviews: Array<{
    bookingId: string;
    turfId: string;
    review: BookingReview;
  }>;
  legalNotice: string;
}

export function cleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) {
    throw new ValidationError('A valid 10-digit mobile number is required.');
  }
  return digits;
}

/**
 * Pure function to extract user data from a Database snapshot under India DPDP Act 2023.
 */
export function extractUserData(db: Database, rawPhone: string): DataExportPayload {
  const phone = cleanPhone(rawPhone);
  const player = db.players.find((p) => p.phone === phone) ?? null;
  const bookings = (db.bookings ?? []).filter((b) => b.customerPhone === phone);
  const walletTransactions = player
    ? (db.walletTxns ?? []).filter((w) => w.playerId === player.id)
    : [];

  const reviews = bookings
    .filter((b) => b.review)
    .map((b) => ({
      bookingId: b.id,
      turfId: b.turfId,
      review: b.review!,
    }));

  return {
    regulation: 'Digital Personal Data Protection Act, 2023 (India)',
    exportedAt: new Date().toISOString(),
    phone,
    player,
    bookings,
    walletTransactions,
    reviews,
    legalNotice:
      'This file contains a copy of your personal data processed by OYUN pursuant to the DPDP Act 2023. Financial and booking records are retained in compliance with applicable Indian tax and accounting laws.',
  };
}

/**
 * Export user data by reading the database.
 */
export async function exportUserData(rawPhone: string): Promise<DataExportPayload> {
  const db = await getDb();
  return extractUserData(db, rawPhone);
}

/**
 * Pure function to apply user deletion and data anonymization on a Database in place.
 */
export function applyUserDeletion(db: Database, rawPhone: string): { bookingsAnonymized: number; reviewsAnonymized: number } {
  const phone = cleanPhone(rawPhone);
  const player = db.players.find((p) => p.phone === phone);
  const playerId = player?.id;

  // 1. Remove player record
  db.players = db.players.filter((p) => p.phone !== phone);

  // 2. Anonymize bookings while preserving tax/audit records
  let bookingsAnonymized = 0;
  let reviewsAnonymized = 0;
  for (const b of db.bookings ?? []) {
    if (b.customerPhone === phone || (playerId && b.playerId === playerId)) {
      b.customerName = 'Deleted Player';
      b.customerPhone = '0000000000';
      b.playerId = null;
      b.accountId = null;
      if (b.review) {
        b.review.name = 'Verified Player';
        reviewsAnonymized++;
      }
      bookingsAnonymized++;
    }
  }

  // 3. Unlink wallet transactions
  if (playerId) {
    db.walletTxns = (db.walletTxns ?? []).filter((w) => w.playerId !== playerId);
  }

  return { bookingsAnonymized, reviewsAnonymized };
}

/**
 * Delete user data and anonymize records in the persistent database.
 */
export async function deleteUserData(rawPhone: string): Promise<{ ok: boolean; bookingsAnonymized: number; reviewsAnonymized: number }> {
  cleanPhone(rawPhone);
  let result = { bookingsAnonymized: 0, reviewsAnonymized: 0 };
  await mutate((db) => {
    result = applyUserDeletion(db, rawPhone);
  });
  return { ok: true, ...result };
}

/**
 * Pure function to apply retention purge rules:
 * - Purge expired holds
 * - Anonymize old completed/cancelled bookings beyond retention window (default 8 years / 2920 days)
 */
export function applyRetentionPurge(
  db: Database,
  options: { nowIso?: string; maxAgeDays?: number } = {}
): { holdsPurged: number; oldBookingsAnonymized: number } {
  const nowIso = options.nowIso || new Date().toISOString();
  const maxAgeDays = options.maxAgeDays ?? 365 * 8; // 8 years statutory limit
  const cutoffTime = new Date(Date.parse(nowIso) - maxAgeDays * 24 * 60 * 60 * 1000).toISOString();

  // 1. Purge expired holds
  const initialHoldsCount = (db.holds ?? []).length;
  db.holds = (db.holds ?? []).filter((h) => h.expiresAt > nowIso);
  const holdsPurged = initialHoldsCount - db.holds.length;

  // 2. Anonymize bookings older than cutoff
  let oldBookingsAnonymized = 0;
  for (const b of db.bookings ?? []) {
    if (b.createdAt < cutoffTime && b.customerPhone !== '0000000000') {
      b.customerName = 'Archived Customer';
      b.customerPhone = '0000000000';
      b.playerId = null;
      b.accountId = null;
      oldBookingsAnonymized++;
    }
  }

  return { holdsPurged, oldBookingsAnonymized };
}

/**
 * Execute retention purge on persistent database.
 */
export async function runRetentionPurge(options: { maxAgeDays?: number } = {}): Promise<{ holdsPurged: number; oldBookingsAnonymized: number }> {
  let result = { holdsPurged: 0, oldBookingsAnonymized: 0 };
  await mutate((db) => {
    result = applyRetentionPurge(db, options);
  });
  return result;
}
