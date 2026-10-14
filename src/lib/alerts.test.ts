import { describe, expect, test } from 'vitest';
import { ALERT_THRESHOLDS, detectDoubleBookings, triggerOnCallPage } from './alerts';
import type { Booking } from './types';
import { GET } from '@/app/api/monitoring/double-bookings/route';

describe('alerts, double booking detection and on-call paging (P8-61)', () => {
  const createMockBooking = (
    id: string,
    code: string,
    hour: number,
    pitch: 'full' | 'A' | 'B' = 'full',
    status: Booking['status'] = 'confirmed',
    turfId = 'turf_test_1',
    date = '2026-10-15'
  ): Booking => ({
    id,
    code,
    turfId,
    date,
    hour,
    timeLabel: `${hour}:00`,
    pitch,
    customerName: 'Player',
    customerPhone: '9876500000',
    playerId: 'pl_test',
    source: 'online',
    createdBy: null,
    addOns: [],
    pricing: {
      basePrice: 1000,
      slotPrice: 1000,
      adjustments: [],
      addOnTotal: 0,
      subtotal: 1000,
      offer: null,
      promo: null,
      advance: 150,
      walletDeduction: 0,
      total: 1000,
    },
    paymentMode: 'venue',
    amountPaid: 0,
    status,
    checkedInAt: null,
    createdAt: new Date().toISOString(),
  });

  test('threshold requires double bookings to be exactly 0', () => {
    expect(ALERT_THRESHOLDS.MAX_DOUBLE_BOOKINGS).toBe(0);
    expect(ALERT_THRESHOLDS.MAX_PAYMENT_FAILURE_RATE).toBe(0.05);
  });

  test('clean schedule reports 0 double bookings', () => {
    const bookings: Booking[] = [
      createMockBooking('bk_1', 'SA-000001', 18, 'full'),
      createMockBooking('bk_2', 'SA-000002', 19, 'full'),
      createMockBooking('bk_3', 'SA-000003', 20, 'full'),
    ];
    const res = detectDoubleBookings(bookings);
    expect(res.count).toBe(0);
    expect(res.conflicts).toHaveLength(0);
  });

  test('split pitch halves (A and B) at the same hour do NOT conflict', () => {
    const bookings: Booking[] = [
      createMockBooking('bk_1', 'SA-000001', 18, 'A'),
      createMockBooking('bk_2', 'SA-000002', 18, 'B'),
    ];
    const res = detectDoubleBookings(bookings);
    expect(res.count).toBe(0);
  });

  test('two full pitch bookings at the same hour trigger double booking collision', () => {
    const bookings: Booking[] = [
      createMockBooking('bk_1', 'SA-000001', 18, 'full'),
      createMockBooking('bk_2', 'SA-000002', 18, 'full'),
    ];
    const res = detectDoubleBookings(bookings);
    expect(res.count).toBe(1);
    expect(res.conflicts[0].bookingCodes).toEqual(['SA-000001', 'SA-000002']);
    expect(res.conflicts[0].hour).toBe(18);
  });

  test('full pitch booking colliding with half A triggers double booking collision', () => {
    const bookings: Booking[] = [
      createMockBooking('bk_1', 'SA-000001', 19, 'full'),
      createMockBooking('bk_2', 'SA-000002', 19, 'A'),
    ];
    const res = detectDoubleBookings(bookings);
    expect(res.count).toBe(1);
    expect(res.conflicts[0].pitchConflict).toBe('full vs A');
  });

  test('cancelled and refunded bookings are excluded from collision calculation', () => {
    const bookings: Booking[] = [
      createMockBooking('bk_1', 'SA-000001', 18, 'full', 'cancelled'),
      createMockBooking('bk_2', 'SA-000002', 18, 'full', 'refunded'),
      createMockBooking('bk_3', 'SA-000003', 18, 'full', 'confirmed'),
    ];
    const res = detectDoubleBookings(bookings);
    expect(res.count).toBe(0);
  });

  test('triggerOnCallPage dispatches mock page when credentials not set', async () => {
    const res = await triggerOnCallPage({
      severity: 'critical',
      title: 'Test Paging Event',
      summary: 'Testing alert threshold dispatch',
    });
    expect(res.paged).toBe(true);
    expect(res.service).toBe('mock');
  });

  test('GET /api/monitoring/double-bookings returns 200 and doubleBookings=0 when clean', async () => {
    const req = new Request('http://localhost:3000/api/monitoring/double-bookings', {
      headers: { 'x-forwarded-for': '127.0.0.1' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.doubleBookings).toBe(0);
  });
});
