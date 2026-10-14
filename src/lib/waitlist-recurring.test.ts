import { beforeEach, describe, expect, test } from 'vitest';
import { cancelWaitlist, getSlotWaitlistCount, joinWaitlist, notifyWaitlistWhenSlotFreed } from './waitlist';
import { calculateRecurringDates, createRecurringBookings } from './recurring';
import { getDb, mutate } from './store';
import { cancelMyBooking } from './booking-actions';
import { addDays, istNow } from './time';
import { newId } from './ids';
import type { Booking } from './types';

describe('Waitlist and recurring weekly bookings (P13-06, #151)', () => {
  const turfId = 'perfect-pass-kodialbail';
  const today = istNow().date;
  const tomorrow = addDays(today, 1);

  beforeEach(async () => {
    // Reset test data
    await mutate((db) => {
      db.waitlist = [];
      db.bookings = db.bookings.filter((b) => !b.customerPhone.startsWith('98765000'));
    });
  });

  describe('Waitlist', () => {
    test('player can join waitlist and gets correct queue position', async () => {
      const res1 = await joinWaitlist({
        turfId,
        date: tomorrow,
        hour: 18,
        name: 'Player One',
        phone: '9876500001',
      });
      expect(res1.ok).toBe(true);
      expect(res1.waitlistId).toMatch(/^wl_/);
      expect(res1.position).toBe(1);

      const res2 = await joinWaitlist({
        turfId,
        date: tomorrow,
        hour: 18,
        name: 'Player Two',
        phone: '9876500002',
      });
      expect(res2.ok).toBe(true);
      expect(res2.position).toBe(2);

      const count = await getSlotWaitlistCount(turfId, tomorrow, 18);
      expect(count).toBe(2);
    });

    test('duplicate waitlist entry by same phone is rejected', async () => {
      await joinWaitlist({
        turfId,
        date: tomorrow,
        hour: 18,
        name: 'Player One',
        phone: '9876500001',
      });

      const dup = await joinWaitlist({
        turfId,
        date: tomorrow,
        hour: 18,
        name: 'Player One',
        phone: '9876500001',
      });
      expect(dup.ok).toBe(false);
      expect(dup.error).toContain('already on the waitlist');
    });

    test('invalid phone number is rejected', async () => {
      const res = await joinWaitlist({
        turfId,
        date: tomorrow,
        hour: 18,
        name: 'Player Bad Phone',
        phone: '123',
      });
      expect(res.ok).toBe(false);
      expect(res.error).toContain('10-digit');
    });

    test('notifyWaitlistWhenSlotFreed notifies in FIFO order', async () => {
      await joinWaitlist({ turfId, date: tomorrow, hour: 19, name: 'First Waiter', phone: '9876500011' });
      await joinWaitlist({ turfId, date: tomorrow, hour: 19, name: 'Second Waiter', phone: '9876500012' });

      const db = await getDb();
      const notified = notifyWaitlistWhenSlotFreed(db, turfId, tomorrow, 19);

      expect(notified).not.toBeNull();
      expect(notified?.customerName).toBe('First Waiter');
      expect(notified?.status).toBe('notified');
      expect(notified?.notifiedAt).toBeTruthy();

      // Second waitlist player is still waiting
      const remaining = db.waitlist?.filter((w) => w.turfId === turfId && w.date === tomorrow && w.hour === 19 && w.status === 'waiting');
      expect(remaining).toHaveLength(1);
      expect(remaining?.[0].customerName).toBe('Second Waiter');
    });

    test('player can cancel waitlist entry with matching phone', async () => {
      const res = await joinWaitlist({ turfId, date: tomorrow, hour: 20, name: 'Cancel Waiter', phone: '9876500021' });
      expect(res.ok).toBe(true);

      const cancelRes = await cancelWaitlist(res.waitlistId!, '9876500021');
      expect(cancelRes.ok).toBe(true);

      const count = await getSlotWaitlistCount(turfId, tomorrow, 20);
      expect(count).toBe(0);
    });

    test('cancelling booking automatically notifies waiting player', async () => {
      // 1. Join waitlist for tomorrow at 21:00
      await joinWaitlist({ turfId, date: tomorrow, hour: 21, name: 'Hopeful Player', phone: '9876500031' });

      // 2. Insert active confirmed booking for tomorrow at 21:00 with proper unguessable bk_ id
      const bookingId = newId('bk');
      await mutate((db) => {
        const b: Booking = {
          id: bookingId,
          code: 'SA-WLCNCL',
          turfId,
          date: tomorrow,
          hour: 21,
          timeLabel: '09:00 PM',
          customerName: 'Current Holder',
          customerPhone: '9876500039',
          playerId: 'pl_holder',
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
          status: 'confirmed',
          checkedInAt: null,
          createdAt: new Date().toISOString(),
        };
        db.bookings.push(b);
      });

      // 3. Current holder cancels booking
      const cancelRes = await cancelMyBooking(bookingId, '9876500039');
      expect(cancelRes).toEqual({ ok: true });

      // 4. Verify waitlist player was automatically transitioned to 'notified'
      const db = await getDb();
      const entry = db.waitlist?.find((w) => w.customerPhone === '9876500031');
      expect(entry?.status).toBe('notified');
      expect(entry?.notifiedAt).toBeTruthy();
    });
  });

  describe('Recurring Weekly Bookings', () => {
    test('calculateRecurringDates produces weekly sequence', () => {
      const dates = calculateRecurringDates('2026-11-01', 4);
      expect(dates).toEqual(['2026-11-01', '2026-11-08', '2026-11-15', '2026-11-22']);
    });

    test('createRecurringBookings books all N weeks atomically with shared recurringGroupId', async () => {
      const res = await createRecurringBookings({
        turfId,
        startDate: tomorrow,
        hour: 6, // 6:00 AM
        weeksCount: 3,
        name: 'Weekly Team FC',
        phone: '9876500041',
      });

      expect(res.ok).toBe(true);
      expect(res.recurringGroupId).toMatch(/^rec_/);
      expect(res.bookingIds).toHaveLength(3);
      expect(res.dates).toHaveLength(3);

      const db = await getDb();
      const booked = db.bookings.filter((b) => b.recurringGroupId === res.recurringGroupId);
      expect(booked).toHaveLength(3);
      expect(booked.map((b) => b.recurringWeek)).toEqual([1, 2, 3]);
      expect(booked.every((b) => b.status === 'confirmed')).toBe(true);
    });

    test('pre-validation collision: fails before booking if any week in the series is taken', async () => {
      const week2Date = addDays(tomorrow, 7);

      // Occupy week 2 slot in advance
      await mutate((db) => {
        db.bookings.push({
          id: newId('bk'),
          code: 'SA-COLLIS',
          turfId,
          date: week2Date,
          hour: 7,
          timeLabel: '07:00 AM',
          customerName: 'Blocker',
          customerPhone: '9876500099',
          playerId: 'pl_blocker',
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
          status: 'confirmed',
          checkedInAt: null,
          createdAt: new Date().toISOString(),
        });
      });

      const res = await createRecurringBookings({
        turfId,
        startDate: tomorrow,
        hour: 7,
        weeksCount: 3,
        name: 'Blocked Team',
        phone: '9876500042',
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain('already taken');

      // Verify atomic behavior: week 1 was NOT booked
      const db = await getDb();
      const week1Booked = db.bookings.find((b) => b.turfId === turfId && b.date === tomorrow && b.hour === 7);
      expect(week1Booked).toBeUndefined();
    });
  });
});
