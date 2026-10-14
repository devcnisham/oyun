import { describe, expect, test, beforeEach } from 'vitest';
import {
  clearNotificationHistory,
  getDispatchedNotifications,
  sendBookingConfirmation,
  sendEmailReceipt,
  sendOwnerAlert,
  sendSlotReminder,
  sendWebPush,
} from './notifications';
import type { Booking, Turf } from './types';

describe('Notifications suite (P12-01 to P12-05)', () => {
  const mockTurf: Turf = {
    id: 'turf_kankanady',
    name: 'Arena One Sports Complex',
    area: 'Kankanady',
    location: 'Near Pumpwell',
    pricePerHour: 1000,
    rating: 4.8,
    reviewCount: 24,
    sports: ['football'],
    images: ['/turfs/arena-one.jpg'],
    city: 'Mangalore',
    amenities: ['Parking'],
    size: '7v7',
    formats: ['7v7'],
    surface: 'Artificial Turf',
    isVerified: true,
    isFeatured: true,
    description: 'Premier sports arena',
    ownerName: 'Sunil Shetty',
    openTime: '06:00',
    closeTime: '23:00',
    status: 'active',
    partnerId: 'p_1',
    phone: '9876543210',
    commissionPercent: null,
    createdAt: new Date().toISOString(),
  };

  const mockBooking: Booking = {
    id: 'bk_000000000001',
    turfId: 'turf_kankanady',
    date: '2026-10-15',
    hour: 18,
    hours: [18, 19],
    status: 'confirmed',
    code: 'SA-NOTIF1',
    customerName: 'Kiran Rao',
    customerPhone: '9876500001',
    amountPaid: 2000,
    timeLabel: '18:00 - 20:00',
    playerId: null,
    source: 'online',
    createdBy: null,
    addOns: [],
    pricing: {
      basePrice: 2000,
      adjustments: [],
      slotPrice: 2000,
      offer: null,
      promo: null,
      addOnTotal: 0,
      subtotal: 2000,
      walletDeduction: 0,
      total: 2000,
      advance: 2000,
    },
    paymentMode: 'full',
    checkedInAt: null,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    clearNotificationHistory();
  });

  test('P12-01: sendBookingConfirmation formats template and records log', async () => {
    const notif = await sendBookingConfirmation(mockBooking, mockTurf);
    expect(notif.type).toBe('confirmation');
    expect(notif.recipient).toBe(mockBooking.customerPhone);
    expect(notif.message).toContain('SA-NOTIF1');
    expect(notif.message).toContain('Arena One Sports Complex');
    expect(getDispatchedNotifications()).toHaveLength(1);
  });

  test('P12-02: sendSlotReminder formats reminder message', async () => {
    const notif = await sendSlotReminder(mockBooking, mockTurf);
    expect(notif.type).toBe('reminder');
    expect(notif.message).toContain('starts in 2 hours');
  });

  test('P12-03: sendOwnerAlert notifies owner on booking and cancellation', async () => {
    const alertNew = await sendOwnerAlert(mockBooking, mockTurf, 'new_booking');
    expect(alertNew.type).toBe('owner_alert');
    expect(alertNew.message).toContain('New Booking Alert');

    const alertCancel = await sendOwnerAlert(mockBooking, mockTurf, 'cancellation');
    expect(alertCancel.message).toContain('Booking Cancelled');
  });

  test('P12-04: sendEmailReceipt formats receipt email', async () => {
    const notif = await sendEmailReceipt(mockBooking, mockTurf, 'kiran@example.com');
    expect(notif.type).toBe('email_receipt');
    expect(notif.channel).toBe('email');
    expect(notif.recipient).toBe('kiran@example.com');
  });

  test('P12-05: sendWebPush enqueues push message payload', async () => {
    const notif = await sendWebPush('https://fcm.googleapis.com/test', {
      title: 'Match starting soon',
      body: 'Get your gear ready!',
    });
    expect(notif.type).toBe('web_push');
    expect(notif.channel).toBe('push');
  });
});
