import { expect, test } from 'vitest';
import { homeDeals } from './home-deals';
import type { Offer } from '@/modules/shared/database/types';
const offer: Offer = { id: 'one', turfId: 'venue', type: 'happy_hour', title: 'Daytime offer', percentOff: 20, startHour: 6, endHour: 11, active: true, createdAt: '' };
test('includes active morning and afternoon offers for public venues', () => {
  const result = homeDeals([offer, { ...offer, id: 'two', startHour: 12, endHour: 16 }], new Set(['venue']));
  expect(result.map(d => d.period)).toEqual(['Morning', 'Afternoon']);
});
test('does not misrepresent first-booking, inactive, night or invalid offers as daytime deals', () => {
  const invalid: Offer[] = [
    { ...offer, type: 'first_time' }, { ...offer, active: false }, { ...offer, turfId: 'private' },
    { ...offer, startHour: 18, endHour: 22 }, { ...offer, percentOff: 101 }, { ...offer, percentOff: 0 },
    { ...offer, endHour: 3 }, { ...offer, startHour: -1 }, { ...offer, percentOff: NaN },
  ];
  expect(homeDeals(invalid, new Set(['venue']))).toEqual([]);
});
test('retains full offer hours when a deal spans morning and afternoon', () => {
  expect(homeDeals([{ ...offer, endHour: 15 }], new Set(['venue']))[0]).toMatchObject({ period: 'Morning & afternoon', startHour: 6, endHour: 15 });
});
