import { describe, expect, test } from 'vitest';
import { LAUNCH_AT, hostFor, isLaunched, previewAllowed, roleForHost, routeForHost } from '@/modules/shared/backend/hosts';

const LIVE = { launched: true, preview: false };
const TEAM = { launched: false, preview: true };
const next = { kind: 'next' };
const go = (host: string, path: string) => ({ kind: 'redirect', host: `${host}.oyun.co.in`, path });

describe('roleForHost', () => {
  test('maps the OYUN hosts, ignoring case, port and a trailing dot', () => {
    expect(roleForHost('oyun.co.in')).toBe('landing');
    expect(roleForHost('WWW.OYUN.CO.IN')).toBe('landing');
    expect(roleForHost('app.oyun.co.in:443')).toBe('app');
    expect(roleForHost('book.oyun.co.in')).toBe('book');
    expect(roleForHost('help.oyun.co.in')).toBe('help');
    expect(roleForHost('partner.oyun.co.in.')).toBe('partner');
    expect(roleForHost('admin.oyun.co.in')).toBe('admin');
    expect(roleForHost('slot-arena-lilac.vercel.app')).toBe('preview');
  });
  test('leaves every other host alone', () => {
    for (const h of ['localhost:3000', 'evil-oyun.co.in', 'oyun.co.in.evil.com', 'x.app.oyun.co.in', 'vercel.app.evil.com', '', null, undefined]) {
      expect(roleForHost(h)).toBeNull();
    }
  });
  test('hostFor', () => {
    expect(hostFor('landing')).toBe('www.oyun.co.in');
    expect(hostFor('app')).toBe('app.oyun.co.in');
    expect(hostFor('help')).toBe('help.oyun.co.in');
  });
});

describe('shared endpoints', () => {
  test('unknown hosts and shared endpoints are never touched', () => {
    expect(routeForHost(null, '/arenas')).toEqual(next);
    for (const role of ['landing', 'app', 'book', 'help', 'partner', 'admin', 'preview'] as const) {
      for (const p of ['/api/health', '/robots.txt', '/sitemap.xml', '/manifest.webmanifest', '/opengraph-image']) expect(routeForHost(role, p)).toEqual(next);
    }
  });
});

const perm = (path: string) => ({ kind: 'redirect', host: 'www.oyun.co.in', path, permanent: true });

describe('landing host (www)', () => {
  test('shows the landing page at / and its pages before launch; sends closed player pages to the countdown', () => {
    expect(routeForHost('landing', '/')).toEqual({ kind: 'rewrite', path: '/landing' });
    for (const p of ['/countdown', '/about', '/privacy', '/terms', '/faq', '/help', '/guides/padel']) expect(routeForHost('landing', p)).toEqual(next);
    expect(routeForHost('landing', '/arenas/perfect-pass-kodialbail')).toEqual(go('www', '/countdown'));
    expect(routeForHost('landing', '/partner/calendar')).toEqual(go('partner', '/partner/calendar'));
    expect(routeForHost('landing', '/admin')).toEqual(go('admin', '/admin'));
  });
  test('a team member with the preview cookie sees the player site on www; the landing page still shows at /', () => {
    expect(routeForHost('landing', '/', TEAM)).toEqual({ kind: 'rewrite', path: '/landing' });
    expect(routeForHost('landing', '/arenas', TEAM)).toEqual(next);
    expect(routeForHost('landing', '/arenas/x', TEAM)).toEqual(next);
  });
  test('after launch www serves the whole public site (the single SEO host)', () => {
    for (const p of ['/', '/arenas', '/arenas/x', '/guides/padel', '/sports/football', '/turfs/kodialbail', '/login']) expect(routeForHost('landing', p, LIVE)).toEqual(next);
    expect(routeForHost('landing', '/countdown', LIVE)).toEqual(perm('/'));
    expect(routeForHost('landing', '/landing', LIVE)).toEqual(perm('/'));
    expect(routeForHost('landing', '/admin', LIVE)).toEqual(go('admin', '/admin'));
  });
  test('the old /welcome address redirects to the countdown before launch and to / after', () => {
    expect(routeForHost('landing', '/welcome')).toEqual(perm('/countdown'));
    expect(routeForHost('landing', '/welcome', LIVE)).toEqual(perm('/'));
  });
});

describe('old subdomains (app, book, help) permanently redirect to www', () => {
  test('after launch every public path moves to the same path on www', () => {
    for (const role of ['app', 'book', 'help'] as const) {
      for (const p of ['/arenas', '/arenas/x', '/bookings/b_1', '/faq', '/guides/padel', '/login']) expect(routeForHost(role, p, LIVE)).toEqual(perm(p));
    }
    expect(routeForHost('help', '/', LIVE)).toEqual(perm('/help'));
    expect(routeForHost('app', '/', LIVE)).toEqual(perm('/'));
  });
  test('help content moves to www even before launch', () => {
    expect(routeForHost('help', '/')).toEqual(perm('/help'));
    for (const p of ['/help', '/faq', '/guides', '/guides/padel-in-mangalore', '/privacy', '/terms']) expect(routeForHost('help', p)).toEqual(perm(p));
  });
  test('never shows the dashboards', () => {
    expect(routeForHost('app', '/partner/login', LIVE)).toEqual(go('partner', '/partner/login'));
    expect(routeForHost('book', '/admin/users', LIVE)).toEqual(go('admin', '/admin/users'));
  });
});

describe('partner and admin hosts', () => {
  test('open their dashboard and refuse the rest', () => {
    expect(routeForHost('partner', '/')).toEqual(go('partner', '/partner'));
    expect(routeForHost('partner', '/partner/bookings')).toEqual(next);
    expect(routeForHost('partner', '/partner/login/sso')).toEqual(next);
    expect(routeForHost('partner', '/partner/signup')).toEqual(next);
    expect(routeForHost('partner', '/admin', LIVE)).toEqual(go('admin', '/admin'));
    expect(routeForHost('partner', '/partnership', LIVE)).toEqual(perm('/partnership'));
    expect(routeForHost('partner', '/partnership')).toEqual(go('www', '/countdown'));
    expect(routeForHost('admin', '/')).toEqual(go('admin', '/admin'));
    expect(routeForHost('admin', '/admin/settings')).toEqual(next);
  });
});

describe('launch gate', () => {
  test('before launch app, book and the vercel.app address send player pages to the landing page', () => {
    expect(routeForHost('app', '/')).toEqual(go('www', '/countdown'));
    expect(routeForHost('app', '/about')).toEqual(go('www', '/about'));
    expect(routeForHost('app', '/faq')).toEqual(perm('/faq'));
    expect(routeForHost('book', '/arenas/x')).toEqual(go('www', '/countdown'));
    expect(routeForHost('preview', '/arenas')).toEqual(go('www', '/countdown'));
  });
  test('dashboards, shared endpoints and help content stay reachable before launch', () => {
    expect(routeForHost('preview', '/partner/login')).toEqual(next);
    expect(routeForHost('preview', '/admin')).toEqual(next);
    expect(routeForHost('preview', '/guides/x')).toEqual(next);
    expect(routeForHost('app', '/partner/login')).toEqual(go('partner', '/partner/login'));
    expect(routeForHost('book', '/api/health')).toEqual(next);
  });
  test('a team member with the preview cookie sees the player site', () => {
    expect(routeForHost('app', '/arenas', TEAM)).toEqual(perm('/arenas'));
    expect(routeForHost('book', '/arenas/x', TEAM)).toEqual(perm('/arenas/x'));
    expect(routeForHost('preview', '/', TEAM)).toEqual(next);
  });
  test('after launch the vercel.app address is just the site', () => {
    expect(routeForHost('preview', '/', LIVE)).toEqual(next);
  });
  test('isLaunched opens at 22 Oct 2026 00:00 IST or with LAUNCH_OPEN=true', () => {
    expect(isLaunched(LAUNCH_AT - 1, undefined)).toBe(false);
    expect(isLaunched(LAUNCH_AT, undefined)).toBe(true);
    expect(isLaunched(LAUNCH_AT - 86_400_000, 'true')).toBe(true);
    expect(isLaunched(LAUNCH_AT - 86_400_000, 'false')).toBe(false);
    expect(new Date(LAUNCH_AT).toISOString()).toBe('2026-10-21T18:30:00.000Z');
  });
  test('previewAllowed needs a key of 16+ characters and an exact cookie match', () => {
    const key = 'a-long-preview-key-123';
    expect(previewAllowed(key, key)).toBe(true);
    expect(previewAllowed('a-long-preview-key-124', key)).toBe(false);
    expect(previewAllowed(undefined, key)).toBe(false);
    expect(previewAllowed(key, undefined)).toBe(false);
    expect(previewAllowed('short', 'short')).toBe(false);
  });
});
