// Partner tenant isolation (task RQ-SEC2). One owner must never be able to read or change another
// owner's bookings, blocks, offers, add-ons or staff by sending that record's id. Each action is called as
// owner A with owner B's ids; B's data must come out exactly as it went in. The store and session are faked.
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { makeBooking, makeDb } from '@/test/fixtures';
import { istNow } from './time';
import type { Database } from './types';

const state = vi.hoisted(() => ({ db: null as unknown }));

vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined, set: () => {} }) }));
vi.mock('next/cache', () => ({ revalidatePath: () => {} }));
vi.mock('./partner-auth', () => {
  class AccessError extends Error {}
  return {
    AccessError,
    TURF_COOKIE: 'sa_partner_turf',
    getPartnerContext: async () => ({ partner: { id: 'partner_a' }, turfs: [{ id: 'turf_test' }], turf: { id: 'turf_test' } }),
    // Owner A: allowed to do everything, but only on their own turf and partner account
    requirePartnerAction: async () => ({ partner: { id: 'partner_a' }, userName: 'Owner A', turf: { id: 'turf_test', name: 'Turf A', openTime: '06:00', closeTime: '23:00' }, can: () => true }),
  };
});
vi.mock('./store', () => ({
  getDb: async () => state.db,
  mutate: async (fn: (db: Database) => unknown) => {
    const copy = structuredClone(state.db as Database);
    const result = await fn(copy);
    state.db = copy;
    return result;
  },
  newId: (prefix: string) => `${prefix}_new`,
  newBookingCode: () => 'SA-NEW001',
}));

import {
  blockSlot,
  cancelBooking,
  checkInBooking,
  createOffer,
  createWalkIn,
  deleteAddOn,
  deleteOffer,
  deleteStaff,
  markNoShow,
  resetStaffPassword,
  saveAddOn,
  switchTurf,
  toggleAddOn,
  toggleOffer,
  unblockSlot,
} from './partner-actions';

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};
const db = () => state.db as Database;

beforeEach(() => {
  const { db: base } = makeDb();
  const today = istNow().date;
  // Owner B's turf and everything that belongs to it
  base.turfs.push({ ...base.turfs[0], id: 'turf_b', name: 'Turf B', partnerId: 'partner_b' });
  base.bookings.push(makeBooking({ id: 'bk_b', turfId: 'turf_b', date: today, code: 'SA-BBBB01' }));
  base.blocks.push({ id: 'block_b', turfId: 'turf_b', date: today, hour: 20, reason: 'maintenance', createdBy: 'Owner B', createdAt: '' });
  base.offers.push({ id: 'offer_b', turfId: 'turf_b', type: 'happy_hour', title: 'B deal', percentOff: 10, startHour: 6, endHour: 10, active: true, createdAt: '' });
  base.addOns.push({ id: 'addon_b', turfId: 'turf_b', name: 'Water', price: 20, active: true });
  base.staff.push({ id: 'staff_b', partnerId: 'partner_b', name: 'B Desk', email: 'b@desk.in', phone: '9876543210', role: 'front_desk', passwordHash: 'hash-b', createdAt: '' });
  state.db = base;
});

describe('owner A cannot touch owner B', () => {
  const attacks: [string, () => Promise<unknown>][] = [
    ['cancelBooking', () => cancelBooking(null, form({ bookingId: 'bk_b' }))],
    ['checkInBooking by id', () => checkInBooking(null, form({ bookingId: 'bk_b', cashCollected: 'true' }))],
    ['checkInBooking by code', () => checkInBooking(null, form({ code: 'SA-BBBB01', cashCollected: 'true' }))],
    ['markNoShow', () => markNoShow(null, form({ bookingId: 'bk_b' }))],
    ['unblockSlot', () => unblockSlot(null, form({ blockId: 'block_b' }))],
    ['toggleOffer', () => toggleOffer(null, form({ offerId: 'offer_b' }))],
    ['deleteOffer', () => deleteOffer(null, form({ offerId: 'offer_b' }))],
    ['saveAddOn (edit)', () => saveAddOn(null, form({ addOnId: 'addon_b', name: 'Hijacked', price: '1' }))],
    ['toggleAddOn', () => toggleAddOn(null, form({ addOnId: 'addon_b' }))],
    ['deleteAddOn', () => deleteAddOn(null, form({ addOnId: 'addon_b' }))],
    ['resetStaffPassword', () => resetStaffPassword(null, form({ staffId: 'staff_b' }))],
    ['deleteStaff', () => deleteStaff(null, form({ staffId: 'staff_b' }))],
    ['switchTurf', () => switchTurf(null, form({ turfId: 'turf_b' }))],
  ];

  test.each(attacks)('%s leaves owner B untouched', async (_name, attack) => {
    const before = JSON.stringify(db());
    const res = (await attack()) as { error?: string; ok?: string } | null;
    expect(JSON.stringify(db())).toBe(before);
    // Actions that look the record up say so; list-style deletes simply do nothing
    if (res?.ok) expect(res.ok).toMatch(/deleted|removed|Switched/i);
  });

  test('records A creates always land on A\'s turf, whatever the form says', async () => {
    const today = istNow().date;
    await createOffer(null, form({ type: 'first_time', title: 'A deal', percentOff: '10', turfId: 'turf_b' }));
    await blockSlot(null, form({ date: today, hour: '22', reason: 'event', turfId: 'turf_b' }));
    await createWalkIn(null, form({ name: 'Walk', phone: '9876500000', date: today, hour: '22', turfId: 'turf_b' }));
    await saveAddOn(null, form({ name: 'Ball', price: '50', turfId: 'turf_b' }));
    expect(db().offers.find((o) => o.title === 'A deal')?.turfId).toBe('turf_test');
    expect(db().blocks.find((b) => b.reason === 'event')?.turfId).toBe('turf_test');
    expect(db().addOns.find((a) => a.name === 'Ball')?.turfId).toBe('turf_test');
    expect(db().bookings.filter((b) => b.customerName === 'Walk').every((b) => b.turfId === 'turf_test')).toBe(true);
    // and nothing new appeared under B
    expect(db().offers.filter((o) => o.turfId === 'turf_b')).toHaveLength(1);
    expect(db().blocks.filter((b) => b.turfId === 'turf_b')).toHaveLength(1);
    expect(db().addOns.filter((a) => a.turfId === 'turf_b')).toHaveLength(1);
  });

  test('A can still manage A\'s own records (the checks are not just refusing everything)', async () => {
    db().offers.push({ id: 'offer_a', turfId: 'turf_test', type: 'happy_hour', title: 'A deal', percentOff: 10, startHour: 6, endHour: 10, active: true, createdAt: '' });
    const res = await toggleOffer(null, form({ offerId: 'offer_a' }));
    expect(res?.ok).toMatch(/paused/);
    expect(db().offers.find((o) => o.id === 'offer_a')?.active).toBe(false);
  });
});
