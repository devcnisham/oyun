import { eraseV2Account, getDb, mutate, withAccountHistory } from '@/modules/shared/database/store';
import type { Database, Player, Booking, WalletTxn, BookingReview } from '@/modules/shared/database/types';
import { ValidationError } from '@/modules/shared/backend/errors';
import { expireStudentIds } from '@/modules/shared/backend/student-id';
import { removeStudentIds } from '@/modules/shared/backend/student-id-storage';

export interface DataExportPayload {
  regulation: string;
  exportedAt: string;
  accountId: string;
  phone: string | null;
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
 * Records that belong to a signed-in account: its player, and the bookings made while signed in to it
 * (or recorded against that player). Phone numbers are never used to find records here, because a phone is
 * typed, not verified: anyone could ask for another person's data.
 */
function accountRecords(db: Database, accountId: string) {
  if (!accountId) throw new ValidationError('Sign in to continue.');
  const player = db.players.find((p) => p.accountId === accountId) ?? null;
  const bookings = (db.bookings ?? []).filter((b) => b.accountId === accountId || (player !== null && b.playerId === player.id));
  return { player, bookings };
}

/**
 * Pure function to extract user data from a Database snapshot under India DPDP Act 2023.
 */
export function extractUserData(db: Database, accountId: string): DataExportPayload {
  const { player, bookings } = accountRecords(db, accountId);
  const walletTransactions = player ? (db.walletTxns ?? []).filter((w) => w.playerId === player.id) : [];

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
    accountId,
    phone: player?.phone ?? null,
    player,
    bookings,
    walletTransactions,
    reviews,
    legalNotice:
      'This file contains a copy of your personal data processed by OYUN pursuant to the DPDP Act 2023. Financial and booking records are retained in compliance with applicable Indian tax and accounting laws.',
  };
}

/**
 * Export the signed-in account's data by reading the database.
 */
export async function exportUserData(accountId: string): Promise<DataExportPayload> {
  const db = await withAccountHistory(await getDb(), accountId);
  return extractUserData(db, accountId);
}

/**
 * Pure function to apply deletion and anonymization for one account on a Database in place.
 */
export function applyUserDeletion(db: Database, accountId: string): { bookingsAnonymized: number; reviewsAnonymized: number; studentIdPath?: string } {
  const { player, bookings } = accountRecords(db, accountId);
  const ids = new Set(bookings.map((b) => b.id));

  // 1. Remove the player record (a student ID photo still waiting for review is deleted by the caller)
  if (player) db.players = db.players.filter((p) => p.id !== player.id);

  // 2. Anonymize bookings while preserving tax/audit records
  let bookingsAnonymized = 0;
  let reviewsAnonymized = 0;
  for (const b of db.bookings ?? []) {
    if (!ids.has(b.id)) continue;
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

  // 3. Unlink wallet transactions
  if (player) db.walletTxns = (db.walletTxns ?? []).filter((w) => w.playerId !== player.id);

  return { bookingsAnonymized, reviewsAnonymized, studentIdPath: player?.student?.idPath };
}

/**
 * Delete the signed-in account's data and anonymize its records in the persistent database.
 */
export async function deleteUserData(accountId: string): Promise<{ ok: boolean; bookingsAnonymized: number; reviewsAnonymized: number }> {
  let result: ReturnType<typeof applyUserDeletion> = { bookingsAnonymized: 0, reviewsAnonymized: 0 };
  const playerId = (await getDb()).players.find((p) => p.accountId === accountId)?.id ?? null;
  await mutate((db) => {
    result = applyUserDeletion(db, accountId);
  });
  // With relational slots the bookings older than the per-request window live only in oyun
  const olderAnonymized = await eraseV2Account(accountId, playerId);
  await removeStudentIds([result.studentIdPath]);
  const { reviewsAnonymized } = result;
  return { ok: true, bookingsAnonymized: result.bookingsAnonymized + olderAnonymized, reviewsAnonymized };
}

/**
 * Pure function to apply retention purge rules:
 * - Purge expired holds
 * - Anonymize old completed/cancelled bookings beyond retention window (default 8 years / 2920 days)
 */
export function applyRetentionPurge(
  db: Database,
  options: { nowIso?: string; maxAgeDays?: number } = {}
): { holdsPurged: number; oldBookingsAnonymized: number; studentIdPaths: string[] } {
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

  // 3. Student ID photos nobody reviewed in time
  const studentIdPaths = expireStudentIds(db, nowIso);

  return { holdsPurged, oldBookingsAnonymized, studentIdPaths };
}

/**
 * Execute retention purge on persistent database.
 */
export async function runRetentionPurge(options: { maxAgeDays?: number } = {}): Promise<{ holdsPurged: number; oldBookingsAnonymized: number }> {
  let result: ReturnType<typeof applyRetentionPurge> = { holdsPurged: 0, oldBookingsAnonymized: 0, studentIdPaths: [] };
  await mutate((db) => {
    result = applyRetentionPurge(db, options);
  });
  await removeStudentIds(result.studentIdPaths);
  return { holdsPurged: result.holdsPurged, oldBookingsAnonymized: result.oldBookingsAnonymized };
}
