import { expect, test } from 'vitest';
import { isPrerendered } from './page-cache-policy';

test('personal account routes always keep request authentication', () => {
  for (const path of ['/profile', '/bookings', '/bookings/bk_123/invoice', '/admin', '/partner']) expect(isPrerendered(path), path).toBe(false);
});

test('public discovery pages remain eligible for cached rendering', () => {
  for (const path of ['/', '/m', '/arenas', '/arenas/perfect-pass-kodialbail', '/sports/football', '/turfs/kodialbail']) expect(isPrerendered(path), path).toBe(true);
});

test('prebuilt editorial and nested discovery routes never receive a runtime nonce', () => {
  for (const path of ['/blog', '/news', '/guides', '/offers', '/membership', '/guides/how-to-book-a-turf-in-mangalore', '/curated/night-turfs-mangalore', '/sports/football/kodialbail', '/sports/pickleball/bejai']) expect(isPrerendered(path), path).toBe(true);
});
