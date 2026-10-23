import { describe, expect, test } from 'vitest';
import { EARLY, MONDAY, makeBooking, makeDb, makePlayer } from '@/test/fixtures';
import { DEFAULT_PLATFORM_OFFERS, isApprovedStudent, parsePlatformOfferForm, platformOffersFor, platformOffersOf } from '@/modules/shared/lib/platform-offers';
import { buildQuote } from '@/modules/shared/lib/pricing';

// Monday 10:00 costs ₹1000 on the test turf (no peak, weekend or last-minute markup)
const quote = (db: ReturnType<typeof makeDb>['db'], extra: Partial<Parameters<typeof buildQuote>[1]> = {}) =>
  buildQuote(db, { turfId: 'turf_test', date: MONDAY, hour: 10, phone: '9876543210', ...extra }, EARLY)!;

const turnOn = (db: ReturnType<typeof makeDb>['db'], regular: number | null, student: number | null) => {
  db.settings.platformOffers = {
    regular: { active: regular !== null, title: 'OYUN offer', percentOff: regular ?? 10 },
    student: { active: student !== null, title: 'Student offer', percentOff: student ?? 15 },
  };
};

describe('platform offers in the price', () => {
  test('both offers start off, so prices do not change', () => {
    const { db } = makeDb();
    expect(quote(db).breakdown.offer).toBeNull();
    expect(quote(db).breakdown.total).toBe(1000);
  });

  test('the regular offer takes its percentage off for everyone', () => {
    const { db } = makeDb();
    turnOn(db, 10, null);
    expect(quote(db).breakdown).toMatchObject({ offer: { label: 'OYUN offer (-10%)', amount: -100 }, total: 900 });
  });

  test('the student offer applies only to an approved student', () => {
    for (const [status, applies] of [['approved', true], ['pending', false], ['rejected', false], [undefined, false]] as const) {
      const { db } = makeDb();
      turnOn(db, null, 20);
      db.players.push(makePlayer({ phone: '9876543210', student: status ? { status, submittedAt: '2026-10-01T00:00:00.000Z' } : undefined }));
      expect(quote(db).breakdown.total, `status ${status}`).toBe(applies ? 800 : 1000);
    }
  });

  test('a player gets the single best offer, never two stacked', () => {
    const { db } = makeDb();
    turnOn(db, 10, 25);
    db.players.push(makePlayer({ phone: '9876543210', student: { status: 'approved', submittedAt: '2026-10-01T00:00:00.000Z' } }));
    expect(quote(db).breakdown).toMatchObject({ offer: { label: 'Student offer (-25%)', amount: -250 }, total: 750 });
  });

  test('the best of platform and turf offers wins', () => {
    const { db, turf } = makeDb();
    turnOn(db, 10, null);
    db.offers.push({ id: 'o1', turfId: turf.id, type: 'happy_hour', title: 'Morning', percentOff: 30, startHour: 6, endHour: 12, active: true, createdAt: '' });
    expect(quote(db).breakdown.offer?.label).toBe('Morning (-30%)');
  });

  test('walk-in bookings at the desk get no platform offers', () => {
    const { db } = makeDb();
    turnOn(db, 50, null);
    expect(quote(db, { source: 'walk_in' }).breakdown.offer).toBeNull();
  });

  test('a booking made before this feature still has no offer line', () => {
    const { db } = makeDb();
    db.bookings.push(makeBooking());
    expect(quote(db).breakdown.offer).toBeNull();
  });
});

describe('platformOffersOf', () => {
  test('fills in anything missing', () => {
    expect(platformOffersOf({})).toEqual(DEFAULT_PLATFORM_OFFERS);
    expect(platformOffersOf({ platformOffers: { regular: { active: true, title: 'X', percentOff: 5 } } as never }).student).toEqual(DEFAULT_PLATFORM_OFFERS.student);
  });
});

describe('platformOffersFor', () => {
  test('only includes the student offer for a student', () => {
    expect(platformOffersFor({}, 't', false).map((o) => o.type)).toEqual(['regular']);
    expect(platformOffersFor({}, 't', true).map((o) => o.type)).toEqual(['regular', 'student']);
  });
});

describe('isApprovedStudent', () => {
  test('is true only for approved', () => {
    expect(isApprovedStudent(undefined)).toBe(false);
    expect(isApprovedStudent(makePlayer())).toBe(false);
    expect(isApprovedStudent(makePlayer({ student: { status: 'approved', submittedAt: '' } }))).toBe(true);
  });
});

describe('parsePlatformOfferForm', () => {
  const form = (o: Record<string, string>) => (k: string) => o[k] ?? '';
  test('reads a valid offer', () => {
    expect(parsePlatformOfferForm(form({ regularTitle: ' Diwali ', regularPercent: '12', regularActive: 'on' }), 'regular')).toEqual({ active: true, title: 'Diwali', percentOff: 12 });
  });
  test('an unticked box means off', () => {
    expect(parsePlatformOfferForm(form({ studentTitle: 'S', studentPercent: '5' }), 'student').active).toBe(false);
  });
  test('rejects a missing name and bad percentages', () => {
    expect(() => parsePlatformOfferForm(form({ regularPercent: '10' }), 'regular')).toThrow(/name/);
    for (const bad of ['0', '91', '5.5', 'abc', '']) expect(() => parsePlatformOfferForm(form({ regularTitle: 'x', regularPercent: bad }), 'regular')).toThrow(/Discount/);
  });
});
