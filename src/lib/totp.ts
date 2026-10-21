import { createHmac, timingSafeEqual } from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

export function generateTotp(secret: string, timestampMs = Date.now(), stepSeconds = 30): string {
  const key = base32Decode(secret);
  const counter = Math.floor(timestampMs / 1000 / stepSeconds);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigInt64BE(BigInt(counter));

  const hmac = createHmac('sha1', key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % 1_000_000).toString().padStart(6, '0');
}

export function verifyTotp(token: string, secret: string, windowSteps = 1, timestampMs = Date.now()): boolean {
  if (!token || !secret) return false;
  const cleanedToken = token.trim();
  if (!/^\d{6}$/.test(cleanedToken)) return false;

  const currentCounter = Math.floor(timestampMs / 1000 / 30);
  const tokenBuf = Buffer.from(cleanedToken, 'utf8');
  for (let step = -windowSteps; step <= windowSteps; step++) {
    const expected = generateTotp(secret, (currentCounter + step) * 30 * 1000);
    const expectedBuf = Buffer.from(expected, 'utf8');
    if (expectedBuf.length === tokenBuf.length && timingSafeEqual(expectedBuf, tokenBuf)) return true;
  }
  return false;
}
