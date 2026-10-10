// Authorization audit (task RQ-SEC1). docs/AUTHORIZATION.md lists every server action, API route and
// dashboard page with who may call it. This test keeps that list honest: a new action, route or page
// that is not classified here fails, and each public action must carry the defence the table promises.
// Admin and partner actions are checked one by one in authorization.test.ts.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

function exportedFunctions(path: string) {
  const out = new Map<string, string>();
  for (const part of read(path).split(/\n(?=export (?:async )?function )/).slice(1)) out.set(/^export (?:async )?function (\w+)/.exec(part)![1], part);
  return out;
}

function files(dir: string, name: string, acc: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files(full, name, acc);
    else if (entry === name) acc.push(full);
  }
  return acc;
}

// Public actions: anyone can call them, so each one names the defence it relies on.
// Every string must appear in the function body.
const PUBLIC_ACTIONS: Record<string, { why: string; needs: string[] }> = {
  getSlotsForDate: { why: 'public availability of active turfs only', needs: ['bookableTurf('] },
  holdSlots: { why: 'rate limited, refused when bookings would not be saved', needs: ['throttle(', 'assertBookingsAreSaved()'] },
  releaseHolds: { why: "releases only this device's own holds", needs: ['deviceHolder(false)', 'h.holder !== holder'] },
  checkReferralCode: { why: 'rate limited because the answer reveals whether a phone is an existing player', needs: ["throttle('referral'"] },
  quoteSelection: { why: 'rate limited, prices a throwaway copy and writes nothing', needs: ['throttle(', 'structuredClone(db)'] },
  createBookings: { why: 'rate limited, signed-in only when Clerk is on, refused when bookings would not be saved', needs: ['throttle(', 'assertBookingsAreSaved()', 'clerkEnabled'] },
  cancelMyBooking: { why: 'unguessable booking id, rate limited, owner account checked, 2 hour cutoff', needs: ['bk_[a-f0-9]{12}', 'throttle(', 'booking.accountId !== accountId', 'canSelfCancel('] },
  submitReview: { why: 'unguessable booking id, rate limited, owner account checked, only after check-in', needs: ['bk_[a-f0-9]{12}', 'throttle(', 'accountId'] },
  getBookingSummaries: { why: 'returns only the ids it is given (unguessable) or the signed-in account\'s own bookings', needs: ['bk_[a-f0-9]{12}', 'currentAccountId()'] },
  submitApplication: { why: 'honeypot, minimum fill time, rate limited, server validation', needs: ['req.website', 'sharedRateLimit(', 'validateApplication('] },
};

describe('public booking actions', () => {
  const fns = exportedFunctions('src/lib/booking-actions.ts');

  test('every exported booking action is classified, and nothing listed has gone missing', () => {
    expect([...fns.keys()].sort()).toEqual(Object.keys(PUBLIC_ACTIONS).sort());
  });

  test.each(Object.entries(PUBLIC_ACTIONS))('%s carries its defence', (name, { needs }) => {
    const body = fns.get(name)!;
    for (const needle of needs) expect(body, `${name} should contain ${needle}`).toContain(needle);
  });
});

describe('login actions', () => {
  const fns = exportedFunctions('src/lib/auth-actions.ts');

  test('only login and logout are exported', () => {
    expect([...fns.keys()].sort()).toEqual(['login', 'logout']);
  });

  test('login is locked out after repeated failures and checks the lock before the password', () => {
    const body = fns.get('login')!;
    expect(body.indexOf('throttle.isLocked(')).toBeGreaterThan(-1);
    expect(body.indexOf('throttle.isLocked(')).toBeLessThan(body.indexOf('adminSubject('));
    expect(body).toContain('throttle.recordFailure(');
  });

  test('logout only accepts a known role', () => {
    expect(fns.get('logout')).toContain('ROLES.includes(role)');
  });
});

describe('API and file routes', () => {
  const ROUTES: Record<string, string[]> = {
    'src/app/api/health/route.ts': ['never keys or data'],
    'src/app/api/client-error/route.ts': ['sharedRateLimit(', 'raw.length > 5000'],
    'src/app/api/holds/release/route.ts': ["origin", 'new URL(origin).host !== host', 'deviceHolder(false)'],
    'src/app/(main)/bookings/[id]/calendar/route.ts': ['db.bookings.find((b) => b.id === id)'],
    'src/app/partner/(dashboard)/payouts/export/route.ts': ["!ctx || !ctx.can('payouts')"],
  };

  test('every route file is classified, and nothing listed has gone missing', () => {
    expect(files('src/app', 'route.ts').sort()).toEqual(Object.keys(ROUTES).sort());
  });

  test.each(Object.entries(ROUTES))('%s keeps its guard', (path, needs) => {
    const body = read(path);
    for (const needle of needs) expect(body, `${path} should contain ${needle}`).toContain(needle);
  });
});

describe('dashboard pages', () => {
  // permission each partner page asks for; null = any signed-in partner or staff member (see the layout)
  const PARTNER_PAGES: Record<string, string | null> = {
    '': null,
    'bookings': 'bookings',
    'calendar': 'bookings',
    'check-in': 'checkin',
    'slots': 'slots',
    'pricing': 'pricing',
    'offers': 'offers',
    'add-ons': 'addons',
    'reviews': null,
    'payouts': 'payouts',
    'invoices/[id]': 'bookings',
    'staff': 'staff',
    'turf': 'turf',
  };
  const base = 'src/app/partner/(dashboard)';

  test('every partner page is classified, and nothing listed has gone missing', () => {
    const found = files(base, 'page.tsx').map((f) => f.slice(base.length + 1).replace(/\/?page\.tsx$/, ''));
    expect(found.sort()).toEqual(Object.keys(PARTNER_PAGES).sort());
  });

  test.each(Object.entries(PARTNER_PAGES))('partner page "%s" asks for permission %s', (dir, permission) => {
    const body = read(join(base, dir, 'page.tsx'));
    const call = permission ? `requirePartner('${permission}')` : 'requirePartner()';
    expect(body).toContain(call);
  });

  test('every admin page sits under the dashboard layout that checks the admin session', () => {
    const pages = files('src/app/admin', 'page.tsx');
    const guarded = pages.filter((p) => p.startsWith('src/app/admin/(dashboard)/'));
    // the only page outside the guarded group is the login screen
    expect(pages.filter((p) => !guarded.includes(p))).toEqual(['src/app/admin/login/page.tsx']);
    expect(read('src/app/admin/(dashboard)/layout.tsx')).toContain("!(await hasSession('admin'))");
  });
});
