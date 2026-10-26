// Ban abusive users (task #161): admin can ban users who post abusive reviews.
// Verifies review is hidden, player is marked banned, and subsequent bookings are blocked.
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { makeBooking, makeDb, makePlayer } from '@/test/fixtures';
import type { Database } from '@/modules/shared/database/types';

const state = vi.hoisted(() => ({ db: null as unknown }));
const getTestDb = () => state.db as Database;

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, set: () => {} }),
  headers: async () => new Headers(),
}));
vi.mock('next/cache', () => ({ revalidatePath: () => {} }));
vi.mock('@/modules/shared/backend/session', () => ({
  hasSession: async (role: string) => role === 'admin',
}));
vi.mock('@/modules/shared/database/store', () => ({
  getDb: async () => state.db,
  mutate: async (fn: (db: Database) => unknown) => {
    const copy = structuredClone(state.db as Database);
    const result = await fn(copy);
    state.db = copy;
    return result;
  },
  newId: (prefix: string) => `${prefix}_1`,
  newBookingCode: () => 'SA-BAN01',
  storageInfo: () => ({ shared: true }),
}));

import { banReviewAuthor } from '@/modules/admin/backend/admin-actions';
import { createBookings } from '@/modules/web/backend/booking-actions';

describe('ban abusive review author', () => {
  beforeEach(() => {
    state.db = makeDb().db;
    vi.setSystemTime(new Date('2026-10-12T04:00:00Z'));
  });

  test('admin bans abusive user: review is hidden and player status becomes banned', async () => {
    const player = makePlayer({ id: 'pl_abusive', phone: '9998887776', name: 'Troll User', status: 'active' });
    getTestDb().players.push(player);

    const booking = makeBooking({
      id: 'bk_abusive',
      playerId: player.id,
      customerPhone: player.phone,
      customerName: player.name,
      review: { rating: 1, comment: 'Abusive derogatory comment', name: 'Troll U.', createdAt: '2026-10-12T00:00:00Z', hidden: false },
    });
    getTestDb().bookings.push(booking);

    const fd = new FormData();
    fd.set('bookingId', booking.id);
    const res = await banReviewAuthor(null, fd);

    expect(res?.ok).toMatch(/banned and review hidden/i);
    const updated = getTestDb();
    expect(updated.bookings[0].review?.hidden).toBe(true);
    expect(updated.players.find((p) => p.id === player.id)?.status).toBe('banned');

    // Banned player cannot book
    const bookRes = await createBookings({
      turfId: 'turf_test',
      date: '2026-10-13',
      hours: [18],
      phone: player.phone,
      name: player.name,
      promoCode: null,
      addOns: [],
      useWallet: false,
    });
    expect(bookRes.error).toMatch(/cannot make bookings/i);
  });

  test('admin bans review author who booked as guest: creates player record and marks banned', async () => {
    const guestBooking = makeBooking({
      id: 'bk_guest_abusive',
      playerId: null,
      customerPhone: '9112223334',
      customerName: 'Anonymous Troll',
      review: { rating: 1, comment: 'Spam review', name: 'Anonymous', createdAt: '2026-10-12T00:00:00Z', hidden: false },
    });
    getTestDb().bookings.push(guestBooking);

    const fd = new FormData();
    fd.set('bookingId', guestBooking.id);
    const res = await banReviewAuthor(null, fd);

    expect(res?.ok).toMatch(/banned and review hidden/i);
    const updated = getTestDb();
    expect(updated.bookings[0].review?.hidden).toBe(true);
    const newBannedPlayer = updated.players.find((p) => p.phone === '9112223334');
    expect(newBannedPlayer).toBeDefined();
    expect(newBannedPlayer?.status).toBe('banned');
  });
});
