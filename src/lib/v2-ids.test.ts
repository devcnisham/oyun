import { describe, expect, test } from 'vitest';
import { legacyToUuid } from './v2-ids';

const UUID_V5 = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('legacyToUuid', () => {
  test('is a valid version 5 uuid', () => {
    expect(legacyToUuid('player', 'pl_abc123')).toMatch(UUID_V5);
  });
  test('is stable: the same id always maps to the same uuid', () => {
    expect(legacyToUuid('booking', 'bk_1')).toBe(legacyToUuid('booking', 'bk_1'));
  });
  test('different ids and different kinds do not collide', () => {
    const ids = new Set([
      legacyToUuid('player', 'x'),
      legacyToUuid('booking', 'x'),
      legacyToUuid('player', 'y'),
    ]);
    expect(ids.size).toBe(3);
  });
  test('refuses an empty id', () => {
    expect(() => legacyToUuid('player', '')).toThrow();
  });
});
