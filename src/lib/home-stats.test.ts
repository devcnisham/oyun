import assert from 'node:assert/strict';
import { test } from 'vitest';
import { homeStats } from './home-stats.ts';

const turf = (area: string, status: 'active' | 'pending' | 'maintenance' | 'suspended' = 'active') => ({ area, status });
const booking = (status: 'confirmed' | 'checked_in' | 'no_show' | 'cancelled' | 'refunded') => ({ status });

test('counts only listed (active) turfs and their distinct areas', () => {
  const stats = homeStats([turf('Kadri'), turf('kadri '), turf('Bejai'), turf('Urwa', 'pending'), turf('Pumpwell', 'suspended')], []);
  assert.deepEqual(
    stats.map((s) => [s.key, s.value]),
    [['turfs', 3], ['areas', 2]]
  );
});

test('bookings made excludes cancelled and refunded', () => {
  const stats = homeStats([turf('Kadri')], [booking('confirmed'), booking('checked_in'), booking('no_show'), booking('cancelled'), booking('refunded')]);
  assert.equal(stats.find((s) => s.key === 'bookings')?.value, 3);
});

test('a stat with no data is left out, and an empty site shows nothing', () => {
  assert.deepEqual(homeStats([], []), []);
  assert.equal(homeStats([turf('Kadri')], [booking('cancelled')]).some((s) => s.key === 'bookings'), false);
});

test('labels are singular for one', () => {
  assert.deepEqual(
    homeStats([turf('Kadri')], [booking('confirmed')]).map((s) => s.label),
    ['turf listed', 'area', 'booking made']
  );
});
