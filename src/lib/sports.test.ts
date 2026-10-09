import assert from 'node:assert/strict';
import { test } from 'vitest';
import { SPORTS, SPORTS_PHRASE, primarySport, sportInfo } from './sports.ts';

test('Padel is not a listed sport, and the site offers four sports', () => {
  assert.ok(!SPORTS.some((s) => (s.value as string) === 'Padel'));
  assert.deepEqual(SPORTS.map((s) => s.value), ['Football', 'Box Cricket', 'Badminton', 'Pickleball']);
});

test('every sport has an icon, an image and a place word', () => {
  for (const s of SPORTS) {
    assert.ok(s.icon && s.image.startsWith('https://images.unsplash.com/'), s.value);
    assert.ok(s.place === 'turf' || s.place === 'court', s.value);
  }
});

test('sport phrase names every sport, not just football', () => {
  assert.equal(SPORTS_PHRASE, 'football, box cricket, badminton and pickleball');
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
