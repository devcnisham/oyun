import { describe, expect, test } from 'vitest';
import { SPORTS, sportFromSlug, sportSlug } from './sports';

describe('sport slugs', () => {
  test('slug is lowercase and url safe', () => {
    expect(sportSlug('Box Cricket')).toBe('box-cricket');
    expect(sportSlug('  Football ')).toBe('football');
  });

  test('every listed sport round-trips and slugs are unique', () => {
    const slugs = SPORTS.map((s) => sportSlug(s.value));
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of SPORTS) expect(sportFromSlug(sportSlug(s.value))?.value).toBe(s.value);
  });

  test('unknown slug is null', () => {
    expect(sportFromSlug('curling')).toBeNull();
  });
});
