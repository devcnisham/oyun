import assert from 'node:assert/strict';
import { describe, expect, test } from 'vitest';
import { SPORTS, SPORTS_PHRASE, primarySport, sportFromSlug, sportInfo, sportSlug } from '@/modules/web/lib/sports';

test('Padel is a listed sport, and the site offers five sports', () => {
  assert.ok(SPORTS.some((s) => (s.value as string) === 'Padel'));
  assert.deepEqual(SPORTS.map((s) => s.value), ['Football', 'Box Cricket', 'Badminton', 'Pickleball', 'Padel']);
});

test('every sport has an icon, an image and a place word', () => {
  for (const s of SPORTS) {
    assert.ok(s.icon && s.image.startsWith('https://images.unsplash.com/'), s.value);
    assert.ok(s.place === 'turf' || s.place === 'court', s.value);
  }
});

test('sport phrase names every sport, not just football', () => {
  assert.equal(SPORTS_PHRASE, 'football, box cricket, badminton, pickleball and padel');
});

test('turf pages pick the right sport name and icon', () => {
  assert.deepEqual(primarySport({ sports: ['Badminton'] }), { label: 'Badminton', icon: '🏸', place: 'court' });
  assert.deepEqual(primarySport({ sports: ['pickleball '] }), { label: 'Pickleball', icon: '🏓', place: 'court' });
  assert.deepEqual(primarySport({ sports: ['Football', 'Box Cricket'] }), { label: 'Football', icon: '⚽', place: 'turf' });
});

test('unknown or missing sports fall back to a neutral icon', () => {
  assert.deepEqual(sportInfo('Volleyball'), { label: 'Volleyball', icon: '🏟️', place: 'turf' });
  assert.deepEqual(primarySport({ sports: [] }), { label: 'Sports', icon: '🏟️', place: 'turf' });
});

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
