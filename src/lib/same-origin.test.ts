import { describe, expect, test } from 'vitest';
import { isSameOrigin } from './same-origin';

const h = (init: Record<string, string>) => new Headers(init);

describe('isSameOrigin', () => {
  test('accepts a request from the same host', () => {
    expect(isSameOrigin(h({ origin: 'https://oyun.in', host: 'oyun.in' }))).toBe(true);
  });
  test('prefers the forwarded host behind a proxy', () => {
    expect(isSameOrigin(h({ origin: 'https://oyun.in', host: 'internal:3000', 'x-forwarded-host': 'oyun.in' }))).toBe(true);
  });
  test('refuses a missing Origin (curl, scripts)', () => {
    expect(isSameOrigin(h({ host: 'oyun.in' }))).toBe(false);
  });
  test('refuses a foreign Origin', () => {
    expect(isSameOrigin(h({ origin: 'https://evil.example', host: 'oyun.in' }))).toBe(false);
  });
  test('refuses a malformed or "null" Origin instead of throwing', () => {
    expect(isSameOrigin(h({ origin: 'null', host: 'oyun.in' }))).toBe(false);
  });
  test('refuses when there is no host to compare with', () => {
    expect(isSameOrigin(h({ origin: 'https://oyun.in' }))).toBe(false);
  });
});
