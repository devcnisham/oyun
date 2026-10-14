import { beforeEach, describe, expect, test, vi } from 'vitest';
import { makeDb, makePlayer } from '@/test/fixtures';
import type { Database } from './types';
import { detectDoubleBookings } from './alerts';

const state = vi.hoisted(() => ({ db: null as unknown, device: 'device-r010-test-token' }));
const getTestDb = () => state.db as Database;

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => (name === 'oyun_device' ? { value: state.device } : undefined), set: () => {} }),
  headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.10' }),
}));
vi.mock('next/cache', () => ({ revalidatePath: () => {} }));
vi.mock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId: null }) }));
vi.mock('./clerk', () => ({ clerkEnabled: false }));
vi.mock('./rate-limit', () => ({ rateLimit: () => true }));
vi.mock('./store', () => {
  let n = 0;
  return {
    getDb: async () => state.db,
    mutate: async (fn: (db: Database) => unknown) => {
      const copy = structuredClone(state.db as Database);
      const result = await fn(copy);
      state.db = copy;
      return result;
    },
    newId: (prefix: string) => `${prefix}_${String(++n).padStart(12, '0')}`,
    newBookingCode: () => `SA-B${String(++n).padStart(5, '0')}`,
    storageInfo: () => ({ shared: true }),
  };
});

import { cancelMyBooking, createBookings, getSlotsForDate } from './booking-actions';
import { addDays, istNow } from './time';

const TURF_ID = 'turf_test';

describe('R010: One order per checkout (#138)', () => {
  beforeEach(() => {
    state.db = makeDb().db;
  });

  test('multi-hour checkout produces a single order with multiple items and one code', async () => {
    const tomorrow = addDays(istNow().date, 1);
    const result = await createBookings({
      turfId: TURF_ID,
      date: tomorrow,
      hours: [18, 19, 20],
      name: 'Team Captain',
      phone: '9876543210',
      promoCode: null,
      addOns: [],
      useWallet: false,
    });

    expect(result.error).toBeUndefined();
    expect(result.ids).toBeDefined();
    expect(result.ids).toHaveLength(1);

    const db = getTestDb();
    const booking = db.bookings.find((b) => b.id === result.ids![0]);
    expect(booking).toBeDefined();

    // Single order fields
    expect(booking!.hours).toEqual([18, 19, 20]);
    expect(booking!.items).toHaveLength(3);
    expect(booking!.durationMinutes).toBe(180);
    expect(booking!.timeLabel).toBe('06:00 PM – 09:00 PM');
    expect(booking!.code).toMatch(/^SA-/);

    // Items verify individual slot pricing
    expect(booking!.items![0].hour).toBe(18);
    expect(booking!.items![1].hour).toBe(19);
    expect(booking!.items![2].hour).toBe(20);

    // Sum of slot prices equals pricing.slotPrice
    const itemTotal = booking!.items!.reduce((s, it) => s + it.price, 0);
    expect(booking!.pricing.slotPrice).toBe(itemTotal);
    expect(booking!.pricing.total).toBe(itemTotal);
  });

  test('multi-hour single order reserves all its slot hours on the slot map', async () => {
    const tomorrow = addDays(istNow().date, 1);
    const result = await createBookings({
      turfId: TURF_ID,
      date: tomorrow,
      hours: [16, 17],
      name: 'Player One',
      phone: '9876543211',
      promoCode: null,
      addOns: [],
      useWallet: false,
    });
    expect(result.ids).toHaveLength(1);

    const slots = await getSlotsForDate(TURF_ID, tomorrow);
    const slot16 = slots.find((s) => s.hour === 16);
    const slot17 = slots.find((s) => s.hour === 17);
    const slot18 = slots.find((s) => s.hour === 18);

    expect(slot16?.available).toBe(false);
    expect(slot16?.reason).toBe('booked');
    expect(slot17?.available).toBe(false);
    expect(slot17?.reason).toBe('booked');
    expect(slot18?.available).toBe(true);
  });
  test('cancelling a multi-hour single order frees all hours and issues a single full refund', async () => {
    const tomorrow = addDays(istNow().date, 2);
    const db = getTestDb();
    const player = makePlayer({ phone: '9876543212', walletBalance: 5000 });
    db.players.push(player);

    const result = await createBookings({
      turfId: TURF_ID,
      date: tomorrow,
      hours: [14, 15],
      name: player.name,
      phone: player.phone,
      promoCode: null,
      addOns: [],
      useWallet: true,
    });
    expect(result.ids).toHaveLength(1);
    const bookingId = result.ids![0];

    // Cancel the single booking order
    const cancelRes = await cancelMyBooking(bookingId, player.phone);
    expect(cancelRes).toEqual({ ok: true });

    // Verify slots are freed
    const slots = await getSlotsForDate(TURF_ID, tomorrow);
    expect(slots.find((s) => s.hour === 14)?.available).toBe(true);
    expect(slots.find((s) => s.hour === 15)?.available).toBe(true);

    // Verify booking status
    const cancelledBooking = getTestDb().bookings.find((b) => b.id === bookingId);
    expect(cancelledBooking?.status).toBe('refunded');
  });

  test('detectDoubleBookings does not falsely flag multi-hour single order as a self-conflict', () => {
    const tomorrow = addDays(istNow().date, 1);
    const multiHourBooking = {
      id: 'bk_multi_1',
      code: 'SA-MULTI1',
      turfId: TURF_ID,
      date: tomorrow,
      hour: 18,
      hours: [18, 19, 20],
      timeLabel: '06:00 PM – 09:00 PM',
      durationMinutes: 180,
      customerName: 'Asha',
      customerPhone: '9876543299',
      playerId: null,
      source: 'online' as const,
      createdBy: null,
      addOns: [],
      pricing: {
        basePrice: 3000,
        adjustments: [],
        slotPrice: 3000,
        offer: null,
        promo: null,
        addOnTotal: 0,
        subtotal: 3000,
        walletDeduction: 0,
        total: 3000,
        advance: 600,
      },
      paymentMode: 'venue' as const,
      amountPaid: 0,
      status: 'confirmed' as const,
      checkedInAt: null,
      createdAt: new Date().toISOString(),
    };

    const conflicts = detectDoubleBookings([multiHourBooking]);
    expect(conflicts.count).toBe(0);
    expect(conflicts.conflicts).toHaveLength(0);
  });
});
