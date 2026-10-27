import { expect, test } from 'vitest';
import { bookingCodeFromQr, bookingQrPayload } from './booking-qr';

test('detailed booking QR keeps payment details and an independently readable check-in code', () => {
  const encoded = bookingQrPayload({ bookingCode: 'SA-ABC123', venue: 'Arena', date: '2026-10-27', time: '01:00 PM – 03:00 PM', name: 'Player', phone: '+91 98••••••77', total: 2000, advanceAtVenue: 300, balanceAfterPlay: 1700 });
  expect(JSON.parse(encoded)).toMatchObject({ name: 'Player', total: 2000, balanceAfterPlay: 1700, currency: 'INR' });
  expect(bookingCodeFromQr(encoded)).toBe('SA-ABC123');
  expect(bookingCodeFromQr(encoded.replace('2000', '1'))).toBe('SA-ABC123');
});

test('legacy QR and manually typed codes keep working', () => {
  expect(bookingCodeFromQr(' sa-abc123 ')).toBe('SA-ABC123');
  expect(bookingCodeFromQr('ABC123')).toBe('ABC123');
  expect(bookingCodeFromQr('SA-TEST1')).toBe('SA-TEST1');
});

test('malformed or unrelated QR data cannot supply a check-in code', () => {
  for (const value of ['{', '{"bookingCode":"SA-ABC123"}', '{"format":"oyun-booking","version":1,"bookingCode":"bad"}', 'https://example.com/SA-ABC123']) expect(bookingCodeFromQr(value)).toBe('');
});
