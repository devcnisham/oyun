// Authorization sweep (task P8-06). Every admin and partner server action must check the caller before it
// touches data, and each partner action must ask for the permission this table expects. A new export that is
// not listed here fails the test, so nobody can add an unguarded action by accident.
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { PERMISSIONS } from './partner-auth';

const read = (path: string) => readFileSync(path, 'utf8');

// Splits a module into its exported functions: name -> source of the function
function exportedFunctions(path: string) {
  const src = read(path);
  const out = new Map<string, string>();
  for (const part of src.split(/\n(?=export (?:async )?function )/).slice(1)) {
    out.set(/^export (?:async )?function (\w+)/.exec(part)![1], part);
  }
  return out;
}

// Position of the first read or write of the store or cookies in a function body
const firstDataAccess = (body: string) => Math.min(...['mutate(', 'getDb(', 'cookies('].map((s) => (body.indexOf(s) < 0 ? Infinity : body.indexOf(s))));

describe('admin actions', () => {
  const fns = exportedFunctions('src/lib/admin-actions.ts');

  test('there are admin actions to check', () => {
    expect(fns.size).toBeGreaterThanOrEqual(20);
  });

  test.each([...fns])('%s checks for an admin session before touching data', (_name, body) => {
    const guard = body.indexOf('requireAdmin()');
    expect(guard, 'requireAdmin() is missing').toBeGreaterThan(-1);
    expect(guard).toBeLessThan(firstDataAccess(body));
  });

  test('requireAdmin() really checks the admin session', () => {
    const src = read('src/lib/admin-actions.ts');
    expect(/async function requireAdmin\(\)[\s\S]{0,200}hasSession\('admin'\)/.test(src)).toBe(true);
  });
});

// action -> the permission it must require. null = any signed-in partner or staff member (see the extra checks below)
const EXPECTED: Record<string, string | null> = {
  switchTurf: null,
  createWalkIn: 'bookings',
  cancelBooking: 'bookings',
  getWalkInSlots: 'bookings',
  checkInBooking: 'checkin',
  markNoShow: 'checkin',
  blockSlot: 'slots',
  unblockSlot: 'slots',
  savePricing: 'pricing',
  createOffer: 'offers',
  toggleOffer: 'offers',
  deleteOffer: 'offers',
  saveAddOn: 'addons',
  toggleAddOn: 'addons',
  deleteAddOn: 'addons',
  createStaff: 'staff',
  resetStaffPassword: 'staff',
  deleteStaff: 'staff',
  updateTurfProfile: 'turf',
  updateCourtSetup: 'turf',
  updateBusiness: 'payouts',
};

describe('partner actions', () => {
  const fns = exportedFunctions('src/lib/partner-actions.ts');

  test('every exported action is classified here, and nothing listed has gone missing', () => {
    expect([...fns.keys()].sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  test.each(Object.entries(EXPECTED).filter(([, p]) => p !== null))('%s requires the %s permission before touching data', (name, permission) => {
    const body = fns.get(name)!;
    const guard = body.indexOf(`requirePartnerAction('${permission}')`);
    expect(guard, `requirePartnerAction('${permission}') is missing`).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(firstDataAccess(body));
  });

  test('switchTurf only switches to a turf that belongs to the signed-in partner', () => {
    const body = fns.get('switchTurf')!;
    expect(body.indexOf('getPartnerContext()')).toBeLessThan(body.indexOf('cookies('));
    expect(body).toContain('!ctx || !ctx.turfs.some((t) => t.id === turfId)');
  });
});

describe('partner routes', () => {
  test('the payouts CSV needs a partner session with the payouts permission', () => {
    const body = read('src/app/partner/(dashboard)/payouts/export/route.ts');
    expect(body).toContain("!ctx || !ctx.can('payouts')");
    expect(body.indexOf("ctx.can('payouts')")).toBeLessThan(body.indexOf('getDb()'));
  });

  test('the partner and admin dashboards redirect visitors who are not signed in', () => {
    expect(read('src/app/partner/(dashboard)/layout.tsx')).toContain('await requirePartner()');
    expect(read('src/app/admin/(dashboard)/layout.tsx')).toContain("!(await hasSession('admin'))");
  });
});

describe('partner role permissions', () => {
  test('front desk cannot change prices, offers, add-ons, the turf profile, staff or payouts', () => {
    for (const p of ['pricing', 'offers', 'addons', 'turf', 'staff', 'payouts']) expect(PERMISSIONS.front_desk).not.toContain(p);
    expect(PERMISSIONS.front_desk).toEqual(['bookings', 'checkin', 'slots']);
  });

  test('a manager cannot manage staff or see payouts', () => {
    expect(PERMISSIONS.manager).not.toContain('staff');
    expect(PERMISSIONS.manager).not.toContain('payouts');
  });

  test('every permission an action asks for exists, and the owner holds all of them', () => {
    const asked = new Set(Object.values(EXPECTED).filter((p): p is string => p !== null));
    for (const p of asked) expect(PERMISSIONS.owner).toContain(p);
    expect(new Set(PERMISSIONS.owner)).toEqual(new Set([...asked, ...PERMISSIONS.owner]));
  });
});
