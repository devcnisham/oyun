export type BookingQrDetails = {
  bookingCode: string;
  venue: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  total: number;
  advanceAtVenue: number;
  balanceAfterPlay: number;
};

export function bookingQrPayload(details: BookingQrDetails): string {
  return JSON.stringify({ format: 'oyun-booking', version: 1, ...details, currency: 'INR' });
}

/** QR amounts are display information; check-in always reloads the actual booking. */
export function bookingCodeFromQr(value: string): string {
  let raw = value.trim();
  if (raw.startsWith('{')) {
    try {
      const payload = JSON.parse(raw) as { format?: unknown; version?: unknown; bookingCode?: unknown };
      if (payload.format !== 'oyun-booking' || payload.version !== 1 || typeof payload.bookingCode !== 'string') return '';
      raw = payload.bookingCode;
    } catch { return ''; }
  }
  raw = raw.toUpperCase().replace(/\s/g, '');
  return /^(?:SA-)?[A-Z0-9]{5,32}$/.test(raw) ? raw : '';
}
