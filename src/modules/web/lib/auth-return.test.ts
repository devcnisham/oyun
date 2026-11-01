import { describe, expect, test } from 'vitest';
import { authReturnPath } from './auth-return';

describe('authentication return path', () => {
  test('uses the local booking route only on local hosts', () => {
    expect(authReturnPath(undefined, 'localhost:3000')).toBe('/booking');
    expect(authReturnPath(undefined, 'book.oyun.co.in')).toBe('/');
    expect(authReturnPath(undefined, 'www.oyun.co.in')).toBe('/');
  });
  test('preserves internal destinations and rejects external returns', () => {
    expect(authReturnPath('/arenas?q=football', 'book.oyun.co.in')).toBe('/arenas?q=football');
    for (const target of ['https://example.org', '//example.org', '/\\example.org']) expect(authReturnPath(target, 'book.oyun.co.in')).toBe('/');
  });
});
