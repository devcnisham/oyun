import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// 64 bytes (512 bits) per OWASP recommendation for scrypt.
// Old hashes stored as 32-byte (64 hex chars) still verify because
// we derive the expected length from the stored hash length.
const HASH_BYTES = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, HASH_BYTES).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  // Derive the same number of bytes as the stored hash so old 32-byte
  // hashes (created before the upgrade) continue to work.
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

// Readable temporary password, e.g. for new staff or approved partners
export function generateTempPassword() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(12);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}
