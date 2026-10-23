import { describe, expect, test } from 'vitest';
import { generateTotp, verifyTotp } from '@/modules/shared/backend/totp';

describe('TOTP (RFC 6238)', () => {
  const secret = 'JBSWY3DPEHPK3PXP'; // Base32 for "Hello!\xde\xad\xbe\xef"

  test('generates 6 digit string codes', () => {
    const code = generateTotp(secret);
    expect(code).toMatch(/^\d{6}$/);
  });

  test('verifies correct code within window', () => {
    const now = Date.now();
    const code = generateTotp(secret, now);
    expect(verifyTotp(code, secret, 1, now)).toBe(true);
  });

  test('accepts code within ±1 step window', () => {
    const now = 1700000000000;
    const prevCode = generateTotp(secret, now - 30_000);
    const nextCode = generateTotp(secret, now + 30_000);

    expect(verifyTotp(prevCode, secret, 1, now)).toBe(true);
    expect(verifyTotp(nextCode, secret, 1, now)).toBe(true);
  });

  test('rejects wrong code or code outside window', () => {
    const now = 1700000000000;
    const farCode = generateTotp(secret, now - 120_000);

    expect(verifyTotp('000000', secret, 1, now)).toBe(false);
    expect(verifyTotp(farCode, secret, 1, now)).toBe(false);
    expect(verifyTotp('invalid', secret, 1, now)).toBe(false);
  });
});
