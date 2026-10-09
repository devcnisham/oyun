import { afterEach, describe, expect, test } from 'vitest';
import { hashPassword, verifyPassword } from './password';
import { migrate, seed } from './seed';

const LEGACY = '@123partner';
const ops = (db: ReturnType<typeof seed>) => db.partners.find((p) => p.id === 'partner_oyun')!;

afterEach(() => {
  delete process.env.PARTNER_PASSWORD;
});

describe('operations partner password', () => {
  test('a new store never accepts the old well-known password', () => {
    delete process.env.PARTNER_PASSWORD;
    expect(verifyPassword(LEGACY, ops(seed()).passwordHash)).toBe(false);
  });

  test('PARTNER_PASSWORD, when set, is the password', () => {
    process.env.PARTNER_PASSWORD = 'a-long-random-passphrase';
    expect(verifyPassword('a-long-random-passphrase', ops(seed()).passwordHash)).toBe(true);
  });

  test('a store seeded with the old default is healed when it loads', () => {
    const db = seed();
    ops(db).passwordHash = hashPassword(LEGACY);
    const healed = migrate(db);
    expect(verifyPassword(LEGACY, ops(healed).passwordHash)).toBe(false);
  });

  test('a password the owner changed is left alone', () => {
    const db = seed();
    ops(db).passwordHash = hashPassword('chosen-by-the-owner');
    const kept = ops(migrate(db)).passwordHash;
    expect(verifyPassword('chosen-by-the-owner', kept)).toBe(true);
  });
});

// The login pages are public, so no password may ship in the page code
describe('login form', () => {
  test('does not contain credentials', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync('src/components/auth/LoginForm.tsx', 'utf8');
    expect(src).not.toMatch(/@123|type="hidden"/);
  });
});
