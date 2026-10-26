import { describe, expect, test } from 'vitest';
import { listLiveOffers } from '@/modules/web/lib/offers-list';
import type { Offer } from '@/modules/shared/database/types';

const offer = (over: Partial<Offer>): Offer => ({ id: 'o1', turfId: 't1', type: 'happy_hour', title: 'Weekday evenings', percentOff: 20, startHour: 18, endHour: 21, active: true, createdAt: '', ...over });
const settings = (platformOffers?: unknown) => ({ platformOffers }) as never;
const turfs = [{ id: 't1', name: 'Perfect Pass' }, { id: 't2', name: 'Arena Two' }];

describe('listLiveOffers', () => {
  test('lists nothing when every offer is off or the turf is not public', () => {
    const db = { settings: settings(), offers: [offer({ active: false }), offer({ id: 'o2', turfId: 'hidden' })] };
    expect(listLiveOffers(db, turfs)).toEqual({ platform: [], turf: [] });
  });

  test('lists the platform offers an admin has switched on', () => {
    const db = { settings: settings({ regular: { active: true, title: 'OYUN offer', percentOff: 10 }, student: { active: true, title: 'Student offer', percentOff: 15 } }), offers: [] };
    const { platform } = listLiveOffers(db, turfs);
    expect(platform.map((p) => p.detail)).toEqual(['10% off every booking', '15% off for approved students. Send your student ID at checkout.']);
  });

  test('lists active turf offers by turf, with the hours for happy hour', () => {
    const db = { settings: settings(), offers: [offer({ id: 'a', turfId: 't2', type: 'first_time', title: 'Welcome', percentOff: 15 }), offer({ id: 'b' })] };
    const { turf } = listLiveOffers(db, turfs);
    expect(turf.map((t) => [t.turfName, t.detail])).toEqual([
      ['Arena Two', '15% off your first booking here'],
      ['Perfect Pass', '20% off from 6 PM to 9 PM'],
    ]);
  });
});
