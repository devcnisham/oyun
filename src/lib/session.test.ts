import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));

import { verifySessionToken } from './session';

const SECRET = 'test-secret';
const sign = (payload: string) => createHmac('sha256', SECRET).update(payload).digest('base64url');
const token = (expiresAt: string | number, role = 'admin', subject = 'admin') => {
  const payload = `${role}.${subject}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
};

describe('session token', () => {
  beforeEach(() => vi.stubEnv('SESSION_SECRET', SECRET));

  test('accepts a valid, unexpired token', () => {
    expect(verifySessionToken(token(Math.floor(Date.now() / 1000) + 60), 'admin')).toBe('admin');
  });

  test('rejects an expired token', () => {
    expect(verifySessionToken(token(Math.floor(Date.now() / 1000) - 1), 'admin')).toBeNull();
  });

  test('rejects a validly signed token whose expiry is not a number', () => {
    expect(verifySessionToken(token('NaN'), 'admin')).toBeNull();
    expect(verifySessionToken(token('abc'), 'admin')).toBeNull();
  });

  test('rejects a tampered signature or the wrong role', () => {
    const t = token(Math.floor(Date.now() / 1000) + 60);
    expect(verifySessionToken(`${t}x`, 'admin')).toBeNull();
    expect(verifySessionToken(t, 'partner')).toBeNull();
  });

  test('accepts per-user admin subject', () => {
    const t = token(Math.floor(Date.now() / 1000) + 60, 'admin', 'admin:ops_nisham');
    expect(verifySessionToken(t, 'admin')).toBe('admin:ops_nisham');
  });

  test('session revocation invalidates token', async () => {
    const { revokeSession } = await import('./session');
    const t = token(Math.floor(Date.now() / 1000) + 60, 'admin', 'admin');
    expect(verifySessionToken(t, 'admin')).toBe('admin');
    revokeSession(t);
    expect(verifySessionToken(t, 'admin')).toBeNull();
  });
});
