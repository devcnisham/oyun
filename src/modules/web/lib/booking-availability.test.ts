import { describe, expect, test } from 'vitest';
import { BOOKINGS_NOT_SAVED_MESSAGE, bookingsAreSaved } from '@/modules/web/lib/booking-availability';

describe('bookingsAreSaved', () => {
  test('bookings are open when the data is shared and kept (Supabase, or a local dev file)', () => {
    expect(bookingsAreSaved({ shared: true, allowEphemeral: false })).toBe(true);
  });

  test('bookings are closed on a serverless host with no database connected', () => {
    expect(bookingsAreSaved({ shared: false, allowEphemeral: false })).toBe(false);
  });

  test('ALLOW_EPHEMERAL_BOOKINGS keeps a demo deployment open on purpose', () => {
    expect(bookingsAreSaved({ shared: false, allowEphemeral: true })).toBe(true);
  });

  test('the message tells the player what is wrong without technical words', () => {
    expect(BOOKINGS_NOT_SAVED_MESSAGE).toMatch(/not open/i);
    expect(BOOKINGS_NOT_SAVED_MESSAGE).not.toMatch(/Supabase|env|serverless/i);
  });
});
