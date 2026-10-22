// The v2 checkout must send the same confirmation and owner alert as the legacy path (it used to return before them).
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

describe('createBookings notifications', () => {
  const src = readFileSync('src/lib/booking-actions.ts', 'utf8');
  const body = src.slice(src.indexOf('export async function createBookings('));

  test('the legacy and the v2 path both notify', () => {
    const v2 = body.slice(body.indexOf('v2Checkout('), body.indexOf('const acquisition'));
    const legacy = body.slice(body.indexOf('const acquisition'));
    expect(v2).toContain('notifyNewBooking(');
    expect(legacy).toContain('notifyNewBooking(');
  });

  test('notifying never fails a saved booking', () => {
    const helper = src.slice(src.indexOf('async function notifyNewBooking('), src.indexOf('export async function createBookings('));
    expect(helper).toContain('try {');
    expect(helper).toContain('catch {}');
    expect(helper).toContain("sendBookingConfirmation(booking, turf).catch(() => {})");
    expect(helper).toContain("sendOwnerAlert(booking, turf, 'new_booking').catch(() => {})");
  });
});
