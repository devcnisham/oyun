import { describe, expect, test } from 'vitest';
import { LAUNCH_AT, hostFor, isLaunched, previewAllowed, roleForHost, routeForHost } from './hosts';

const LIVE = { launched: true, preview: false };
const TEAM = { launched: false, preview: true };

describe('roleForHost', () => {
  test('maps the OYUN hosts, ignoring case, port and a trailing dot', () => {
    expect(roleForHost('oyun.co.in')).toBe('landing');
    expect(roleForHost('WWW.OYUN.CO.IN')).toBe('landing');
    expect(roleForHost('book.oyun.co.in:443')).toBe('book');
    expect(roleForHost('partner.oyun.co.in.')).toBe('partner');
    expect(roleForHost('admin.oyun.co.in')).toBe('admin');
  });
  test('leaves every other host alone', () => {
    expect(roleForHost('slot-arena-lilac.vercel.app')).toBe('preview');
    for (const h of ['localhost:3000', 'evil-oyun.co.in', 'oyun.co.in.evil.com', 'x.book.oyun.co.in', '', null, undefined]) {
      expect(roleForHost(h)).toBeNull();
    }
  });
});

describe('routeForHost', () => {
  test('unknown hosts and shared endpoints are never touched', () => {
    expect(routeForHost(null, '/arenas')).toEqual({ kind: 'next' });
    for (const role of ['landing', 'book', 'partner', 'admin'] as const) {
      for (const p of ['/api/health', '/robots.txt', '/sitemap.xml', '/manifest.webmanifest', '/opengraph-image']) expect(routeForHost(role, p)).toEqual({ kind: 'next' });
    }
  });

  test('landing host shows the landing page at / and its few pages, and sends the rest to the booking site', () => {
    expect(routeForHost('landing', '/')).toEqual({ kind: 'rewrite', path: '/welcome' });
    for (const p of ['/welcome', '/about', '/privacy', '/terms', '/faq']) expect(routeForHost('landing', p)).toEqual({ kind: 'next' });
    // Booking pages are closed before launch, so they go back to the landing page, not to the booking host
    expect(routeForHost('landing', '/arenas/perfect-pass-kodialbail')).toEqual({ kind: 'redirect', host: 'www.oyun.co.in', path: '/' });
    expect(routeForHost('landing', '/partner/calendar')).toEqual({ kind: 'redirect', host: 'partner.oyun.co.in', path: '/partner/calendar' });
    expect(routeForHost('landing', '/admin')).toEqual({ kind: 'redirect', host: 'admin.oyun.co.in', path: '/admin' });
  });

  test('booking host serves the player site and never the dashboards (once open)', () => {
    expect(routeForHost('book', '/', LIVE)).toEqual({ kind: 'next' });
    expect(routeForHost('book', '/arenas', LIVE)).toEqual({ kind: 'next' });
    expect(routeForHost('book', '/partner/login')).toEqual({ kind: 'redirect', host: 'partner.oyun.co.in', path: '/partner/login' });
    expect(routeForHost('book', '/admin/users')).toEqual({ kind: 'redirect', host: 'admin.oyun.co.in', path: '/admin/users' });
  });

  test('partner and admin hosts open their dashboard and refuse the rest', () => {
    expect(routeForHost('partner', '/')).toEqual({ kind: 'redirect', host: 'partner.oyun.co.in', path: '/partner' });
    expect(routeForHost('partner', '/partner/bookings')).toEqual({ kind: 'next' });
    expect(routeForHost('partner', '/admin', LIVE)).toEqual({ kind: 'redirect', host: 'book.oyun.co.in', path: '/admin' });
    expect(routeForHost('partner', '/partnership', LIVE)).toEqual({ kind: 'redirect', host: 'book.oyun.co.in', path: '/partnership' });
    expect(routeForHost('partner', '/partnership')).toEqual({ kind: 'redirect', host: 'www.oyun.co.in', path: '/' });
    expect(routeForHost('admin', '/')).toEqual({ kind: 'redirect', host: 'admin.oyun.co.in', path: '/admin' });
    expect(routeForHost('admin', '/admin/settings')).toEqual({ kind: 'next' });
  });

  test('hostFor', () => {
    expect(hostFor('landing')).toBe('www.oyun.co.in');
    expect(hostFor('book')).toBe('book.oyun.co.in');
  });
});

describe('launch gate', () => {
  test('before launch the booking host and the vercel.app address send player pages to the landing page', () => {
    expect(routeForHost('book', '/')).toEqual({ kind: 'redirect', host: 'www.oyun.co.in', path: '/' });
    expect(routeForHost('book', '/arenas/x')).toEqual({ kind: 'redirect', host: 'www.oyun.co.in', path: '/' });
    expect(routeForHost('preview', '/arenas')).toEqual({ kind: 'redirect', host: 'www.oyun.co.in', path: '/' });
    expect(routeForHost('preview', '/about')).toEqual({ kind: 'redirect', host: 'www.oyun.co.in', path: '/about' });
  });

  test('dashboards and shared endpoints stay reachable before launch', () => {
    expect(routeForHost('preview', '/partner/login')).toEqual({ kind: 'next' });
    expect(routeForHost('preview', '/admin')).toEqual({ kind: 'next' });
    expect(routeForHost('book', '/partner/login')).toEqual({ kind: 'redirect', host: 'partner.oyun.co.in', path: '/partner/login' });
    expect(routeForHost('book', '/api/health')).toEqual({ kind: 'next' });
  });

  test('a team member with the preview cookie sees the booking site, but www still shows the landing page', () => {
    expect(routeForHost('book', '/arenas', TEAM)).toEqual({ kind: 'next' });
    expect(routeForHost('preview', '/', TEAM)).toEqual({ kind: 'next' });
    expect(routeForHost('landing', '/', TEAM)).toEqual({ kind: 'rewrite', path: '/welcome' });
    expect(routeForHost('landing', '/arenas', TEAM)).toEqual({ kind: 'redirect', host: 'book.oyun.co.in', path: '/arenas' });
  });

  test('after launch every host is just the site, and www stops showing the landing page', () => {
    expect(routeForHost('landing', '/', LIVE)).toEqual({ kind: 'next' });
    expect(routeForHost('landing', '/arenas', LIVE)).toEqual({ kind: 'next' });
    expect(routeForHost('preview', '/', LIVE)).toEqual({ kind: 'next' });
    expect(routeForHost('landing', '/admin', LIVE)).toEqual({ kind: 'redirect', host: 'admin.oyun.co.in', path: '/admin' });
  });

  test('isLaunched opens at 31 Oct 2026 00:00 IST or with LAUNCH_OPEN=true', () => {
    expect(isLaunched(LAUNCH_AT - 1, undefined)).toBe(false);
    expect(isLaunched(LAUNCH_AT, undefined)).toBe(true);
    expect(isLaunched(LAUNCH_AT - 86_400_000, 'true')).toBe(true);
    expect(isLaunched(LAUNCH_AT - 86_400_000, 'false')).toBe(false);
    expect(new Date(LAUNCH_AT).toISOString()).toBe('2026-10-30T18:30:00.000Z');
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
