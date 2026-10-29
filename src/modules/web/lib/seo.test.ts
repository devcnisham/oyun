import { describe, expect, test, vi } from 'vitest';
import { bandFromSlug, bandSlug } from '@/modules/web/lib/price-bands';
import { isIndexableTurf, ogBase } from '@/modules/web/lib/seo';

describe('isIndexableTurf', () => {
  test('keeps real venues, drops the test venue and demo addresses', () => {
    expect(isIndexableTurf({ id: 'perfect-pass-kodialbail', location: 'Kodialbail, Mangalore' })).toBe(true);
    expect(isIndexableTurf({ id: 'oyun-club-test', location: 'Mangalore' })).toBe(false);
    expect(isIndexableTurf({ id: 'turf_test_payout', location: 'Mangalore' })).toBe(false);
    expect(isIndexableTurf({ id: 'griffins', location: 'Demo address, Kadri, Mangalore' })).toBe(false);
  });
});

describe('ogBase', () => {
  test('repeats the site-wide Open Graph fields', () => {
    expect(ogBase('/arenas')).toEqual({ type: 'website', locale: 'en_IN', siteName: 'OYUN', url: '/arenas' });
  });
});

describe('price bands', () => {
  test('round-trips slugs and rejects unknown bands', () => {
    expect(bandFromSlug(bandSlug(700))).toBe(700);
    expect(bandFromSlug('under-123')).toBeNull();
    expect(bandFromSlug('under-abc')).toBeNull();
    expect(bandFromSlug('football')).toBeNull();
  });
});

describe('robots', () => {
  async function robotsFor(host: string) {
    vi.resetModules();
    vi.doMock('next/headers', () => ({ headers: async () => new Headers({ host }) }));
    const mod = await import('@/app/robots');
    return mod.default();
  }
  test('www allows public pages, blocks private ones and lists the sitemap', async () => {
    const r = await robotsFor('www.oyun.co.in');
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule.allow).toBe('/');
    expect(rule.disallow).toEqual(expect.arrayContaining(['/admin', '/partner', '/bookings', '/api/']));
    expect(r.sitemap).toMatch(/\/sitemap\.xml$/);
  });
  test('old subdomains and dashboards are blocked entirely', async () => {
    for (const host of ['app.oyun.co.in', 'book.oyun.co.in', 'help.oyun.co.in', 'partner.oyun.co.in', 'admin.oyun.co.in']) {
      const r = await robotsFor(host);
      const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
      expect(rule.disallow).toBe('/');
    }
  });
});

describe('localized pages', () => {
  test('hreflang is only advertised once the Kannada and Hindi pages are opened to search engines', async () => {
    const { localeAlternates } = await import('@/modules/web/lib/seo');
    const prev = process.env.LOCALIZED_PAGES_INDEXED;
    delete process.env.LOCALIZED_PAGES_INDEXED;
    expect(localeAlternates()).toBeUndefined();
    process.env.LOCALIZED_PAGES_INDEXED = 'true';
    expect(localeAlternates()).toEqual({ 'en-IN': '/', 'kn-IN': '/kn', 'hi-IN': '/hi', 'x-default': '/' });
    if (prev === undefined) delete process.env.LOCALIZED_PAGES_INDEXED;
    else process.env.LOCALIZED_PAGES_INDEXED = prev;
  });
  test('every localized page has the same structure', async () => {
    const { LOCALIZED } = await import('@/modules/web/lib/localized-home');
    for (const c of Object.values(LOCALIZED)) {
      expect(c.steps).toHaveLength(3);
      expect(c.faqs.length).toBeGreaterThanOrEqual(3);
      expect(c.sports.map((s) => s.slug)).toEqual(['football', 'box-cricket', 'badminton', 'pickleball']);
      expect(c.h1.length).toBeGreaterThan(5);
    }
  });
});
