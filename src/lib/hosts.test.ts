import { describe, expect, test } from 'vitest';
import { hostFor, roleForHost, routeForHost } from './hosts';

describe('roleForHost', () => {
  test('maps the OYUN hosts, ignoring case, port and a trailing dot', () => {
    expect(roleForHost('oyun.co.in')).toBe('landing');
    expect(roleForHost('WWW.OYUN.CO.IN')).toBe('landing');
    expect(roleForHost('book.oyun.co.in:443')).toBe('book');
    expect(roleForHost('partner.oyun.co.in.')).toBe('partner');
    expect(roleForHost('admin.oyun.co.in')).toBe('admin');
  });
  test('leaves every other host alone', () => {
    for (const h of ['localhost:3000', 'slot-arena-lilac.vercel.app', 'evil-oyun.co.in', 'oyun.co.in.evil.com', 'x.book.oyun.co.in', '', null, undefined]) {
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
    expect(routeForHost('landing', '/arenas/perfect-pass-kodialbail')).toEqual({ kind: 'redirect', host: 'book.oyun.co.in', path: '/arenas/perfect-pass-kodialbail' });
    expect(routeForHost('landing', '/partner/calendar')).toEqual({ kind: 'redirect', host: 'partner.oyun.co.in', path: '/partner/calendar' });
    expect(routeForHost('landing', '/admin')).toEqual({ kind: 'redirect', host: 'admin.oyun.co.in', path: '/admin' });
  });

  test('booking host serves the player site and never the dashboards', () => {
    expect(routeForHost('book', '/')).toEqual({ kind: 'next' });
    expect(routeForHost('book', '/arenas')).toEqual({ kind: 'next' });
    expect(routeForHost('book', '/partner/login')).toEqual({ kind: 'redirect', host: 'partner.oyun.co.in', path: '/partner/login' });
    expect(routeForHost('book', '/admin/users')).toEqual({ kind: 'redirect', host: 'admin.oyun.co.in', path: '/admin/users' });
  });

  test('partner and admin hosts open their dashboard and refuse the rest', () => {
    expect(routeForHost('partner', '/')).toEqual({ kind: 'redirect', host: 'partner.oyun.co.in', path: '/partner' });
    expect(routeForHost('partner', '/partner/bookings')).toEqual({ kind: 'next' });
    expect(routeForHost('partner', '/admin')).toEqual({ kind: 'redirect', host: 'book.oyun.co.in', path: '/admin' });
    expect(routeForHost('partner', '/partnership')).toEqual({ kind: 'redirect', host: 'book.oyun.co.in', path: '/partnership' });
    expect(routeForHost('admin', '/')).toEqual({ kind: 'redirect', host: 'admin.oyun.co.in', path: '/admin' });
    expect(routeForHost('admin', '/admin/settings')).toEqual({ kind: 'next' });
  });

  test('hostFor', () => {
    expect(hostFor('landing')).toBe('www.oyun.co.in');
    expect(hostFor('book')).toBe('book.oyun.co.in');
  });
});
