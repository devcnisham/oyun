// Rain policy (P13-15): who may declare rain, which turfs and dates it covers, and what the cancel action does.
// Store, session, partner context and clock are faked.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { makeBooking, makeDb, makePlayer } from '@/test/fixtures';
import type { Database } from '@/modules/shared/database/types';

const state = vi.hoisted(() => ({ db: null as unknown, ctxTurfId: 'turf_test', admin: true }));
const getTestDb = () => state.db as Database;

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, set: () => {} }),
  headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.9' }),
}));
vi.mock('next/cache', () => ({ revalidatePath: () => {} }));
vi.mock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId: null }) }));
vi.mock('@/modules/shared/lib/clerk', () => ({ clerkEnabled: false }));
vi.mock('@/modules/shared/backend/rate-limit', () => ({ rateLimit: () => true }));
vi.mock('@/modules/shared/backend/session', () => ({ hasSession: async (role: string) => role === 'admin' && state.admin }));
vi.mock('@/modules/shared/backend/partner-auth', () => {
  class AccessError extends Error {}
  return {
    AccessError,
    TURF_COOKIE: 'sa_partner_turf',
    getPartnerContext: async () => null,
    // The signed-in partner's own turf is the only turf the action ever sees
    requirePartnerAction: async () => {
      const turf = (state.db as Database).turfs.find((t) => t.id === state.ctxTurfId)!;
      return { partner: { id: 'partner_x' }, userName: 'Owner', turf, can: () => true };
    },
  };
});
vi.mock('@/modules/shared/database/store', () => {
  let n = 0;
  return {
    getDb: async () => state.db,
    mutate: async (fn: (db: Database) => unknown) => {
      const copy = structuredClone(state.db as Database);
      const result = await fn(copy);
      state.db = copy;
      return result;
    },
    newId: (prefix: string) => `${prefix}_${++n}`,
    newBookingCode: () => `SA-R${String(++n).padStart(5, '0')}`,
    storageInfo: () => ({ shared: true }),
  };
});

import { setRainDay } from '@/modules/admin/backend/admin-actions';
import { cancelMyBooking, rescheduleBooking } from '@/modules/web/backend/booking-actions';
import { setRainOut } from '@/modules/partner/backend/partner-actions';
import { isRainDisruption } from '@/modules/shared/lib/rain';

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};

const DATE = '2026-10-13';
const PHONE = '9876543210';
const OUTDOOR = ['Floodlights', 'Parking'];
const INDOOR = ['Indoor', 'Floodlights'];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-12T04:00:00Z'));
  state.db = makeDb({ amenities: OUTDOOR }).db;
  state.ctxTurfId = 'turf_test';
  state.admin = true;
});
afterEach(() => vi.useRealTimers());

describe('isRainDisruption', () => {
  const settings = (rainDays?: string[]) => ({ settings: { ...makeDb().db.settings, rainDays } });

  test('an outdoor turf is rained out on its own marked date only', () => {
    const turf = { amenities: OUTDOOR, rainOutDates: [DATE] };
    expect(isRainDisruption(turf, DATE, settings())).toBe(true);
    expect(isRainDisruption(turf, '2026-10-14', settings())).toBe(false);
  });

  test('an indoor or covered turf never qualifies, even when marked or on a city-wide day', () => {
    const turf = { amenities: INDOOR, rainOutDates: [DATE] };
    expect(isRainDisruption(turf, DATE, settings([DATE]))).toBe(false);
    expect(isRainDisruption({ amenities: ['Covered pitch'] }, DATE, settings([DATE]))).toBe(false);
  });

  test('a city-wide day applies to every outdoor turf, only on that date', () => {
    expect(isRainDisruption({ amenities: OUTDOOR }, DATE, settings([DATE]))).toBe(true);
    expect(isRainDisruption({ amenities: OUTDOOR }, '2026-10-14', settings([DATE]))).toBe(false);
    expect(isRainDisruption({ amenities: OUTDOOR }, DATE, settings())).toBe(false);
  });

  test('old data without the new fields loads as no disruption', () => {
    expect(isRainDisruption({ amenities: OUTDOOR }, DATE, { settings: {} as never })).toBe(false);
    expect(isRainDisruption(undefined, DATE, settings([DATE]))).toBe(false);
  });
});

describe('cancelMyBooking under rain', () => {
  // 17:00 India, one hour before the 18:00 slot: inside the 2 hour cutoff
  const inCutoff = () => vi.setSystemTime(new Date('2026-10-13T11:30:00Z'));
  const online = (over = {}) => {
    const b = makeBooking({ id: 'bk_abcdef012345', date: DATE, hour: 18, paymentMode: 'full', amountPaid: 1000, ...over });
    getTestDb().bookings.push(b);
    return b;
  };

  test('without rain the cutoff still applies', async () => {
    inCutoff();
    online();
    expect(await cancelMyBooking('bk_abcdef012345', PHONE)).toMatchObject({ error: expect.stringMatching(/2 hours/) });
    expect(getTestDb().bookings[0].status).toBe('confirmed');
  });

  test('an online confirmed booking can be cancelled inside the cutoff and gets the full amount in the wallet', async () => {
    const player = makePlayer({ walletBalance: 50 });
    getTestDb().players.push(player);
    getTestDb().turfs[0].rainOutDates = [DATE];
    inCutoff();
    online({ playerId: player.id, pricing: { ...makeBooking().pricing, walletDeduction: 200, total: 1200 } });
    expect(await cancelMyBooking('bk_abcdef012345', PHONE)).toEqual({ ok: true });
    const after = getTestDb();
    expect(after.players[0].walletBalance).toBe(50 + 1000 + 200);
    expect(after.bookings[0]).toMatchObject({ status: 'refunded', cancelReason: 'rain' });
    expect(after.walletTxns).toHaveLength(1);
    expect(after.walletTxns[0]).toMatchObject({ amount: 1200, type: 'refund' });
  });

  test('a city-wide rain day works the same, and an indoor turf on that day is still held to the cutoff', async () => {
    getTestDb().settings.rainDays = [DATE];
    inCutoff();
    online();
    expect(await cancelMyBooking('bk_abcdef012345', PHONE)).toEqual({ ok: true });

    state.db = makeDb({ amenities: INDOOR }).db;
    getTestDb().settings.rainDays = [DATE];
    online();
    expect(await cancelMyBooking('bk_abcdef012345', PHONE)).toMatchObject({ error: expect.stringMatching(/2 hours/) });
    expect(getTestDb().bookings[0].status).toBe('confirmed');
  });

  test('a client-sent flag is ignored: extra arguments cannot switch the policy on', async () => {
    inCutoff();
    online();
    const spoofed = cancelMyBooking as unknown as (...a: unknown[]) => Promise<unknown>;
    expect(await spoofed('bk_abcdef012345', PHONE, true, { isWeatherDisruption: true, rain: true })).toMatchObject({ error: expect.stringMatching(/2 hours/) });
    expect(getTestDb().bookings[0].status).toBe('confirmed');
    expect(getTestDb().bookings[0].cancelReason).toBeUndefined();
  });

  test('rescheduling is also held to the cutoff unless the server finds rain', async () => {
    inCutoff();
    online();
    expect(await rescheduleBooking('bk_abcdef012345', '2026-10-14', 10, PHONE)).toMatchObject({ error: expect.stringMatching(/2 hours/) });
    getTestDb().turfs[0].rainOutDates = [DATE];
    expect(await rescheduleBooking('bk_abcdef012345', '2026-10-14', 10, PHONE)).toEqual({ ok: true });
  });
});

describe('setRainOut (partner)', () => {
  test('marks and clears a date on the signed-in partner turf only', async () => {
    const { db } = makeDb({ amenities: OUTDOOR });
    db.turfs.push({ ...db.turfs[0], id: 'turf_other', rainOutDates: [] });
    state.db = db;
    expect(await setRainOut(null, form({ date: DATE, mode: 'set' }))).toMatchObject({ ok: expect.any(String) });
    expect(getTestDb().turfs.find((t) => t.id === 'turf_test')!.rainOutDates).toEqual([DATE]);
    expect(getTestDb().turfs.find((t) => t.id === 'turf_other')!.rainOutDates).toEqual([]);
    expect(await setRainOut(null, form({ date: DATE, mode: 'clear' }))).toMatchObject({ ok: expect.any(String) });
    expect(getTestDb().turfs.find((t) => t.id === 'turf_test')!.rainOutDates).toEqual([]);
  });

  test('a partner cannot flag another partner turf, even by sending its id', async () => {
    const { db } = makeDb({ amenities: OUTDOOR });
    db.turfs.push({ ...db.turfs[0], id: 'turf_other' });
    state.db = db;
    state.ctxTurfId = 'turf_other'; // this partner owns turf_other and tries to hit turf_test
    await setRainOut(null, form({ date: DATE, mode: 'set', turfId: 'turf_test', id: 'turf_test' }));
    expect(getTestDb().turfs.find((t) => t.id === 'turf_test')!.rainOutDates).toBeUndefined();
    expect(getTestDb().turfs.find((t) => t.id === 'turf_other')!.rainOutDates).toEqual([DATE]);
  });

  test('an indoor turf cannot be marked, and a past date is refused', async () => {
    state.db = makeDb({ amenities: INDOOR }).db;
    expect(await setRainOut(null, form({ date: DATE, mode: 'set' }))).toMatchObject({ error: expect.stringMatching(/outdoor/i) });
    state.db = makeDb({ amenities: OUTDOOR }).db;
    expect(await setRainOut(null, form({ date: '2026-10-01', mode: 'set' }))).toMatchObject({ error: expect.stringMatching(/passed/) });
    expect(getTestDb().turfs[0].rainOutDates).toBeUndefined();
  });
});

describe('setRainDay (admin)', () => {
  test('declares and clears a city-wide day', async () => {
    expect(await setRainDay(null, form({ date: DATE, mode: 'set' }))).toMatchObject({ ok: expect.any(String) });
    expect(getTestDb().settings.rainDays).toEqual([DATE]);
    await setRainDay(null, form({ date: DATE, mode: 'clear' }));
    expect(getTestDb().settings.rainDays).toEqual([]);
  });

  test('without an admin session nothing changes', async () => {
    state.admin = false;
    expect(await setRainDay(null, form({ date: DATE, mode: 'set' }))).toMatchObject({ error: expect.any(String) });
    expect(getTestDb().settings.rainDays).toBeUndefined();
  });
});
