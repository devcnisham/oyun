import { randomBytes } from 'node:crypto';
import type { Database } from '@/modules/shared/database/types';

export function newId(prefix: string) {
  return `${prefix}_${randomBytes(6).toString('hex')}`;
}

export function newBookingCode(db: Database) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (;;) {
    const code = 'SA-' + Array.from(randomBytes(6), (b) => alphabet[b % alphabet.length]).join('');
    if (!db.bookings.some((b) => b.code === code)) return code;
  }
}
