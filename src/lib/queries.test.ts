import { describe, expect, it } from 'vitest';
import {
  TAG_PUBLIC_TURFS,
  TAG_SETTINGS,
  TAG_SITE_CONTENT,
  getPublicTurf,
  getSettings,
  getSiteContent,
  listAreas,
  listPublicTurfs,
} from './queries';
import { refreshAll } from './action-utils';

describe('queries and cache tags', () => {
  it('exports expected cache tags for ISR revalidation', () => {
    expect(TAG_PUBLIC_TURFS).toBe('public-turfs');
    expect(TAG_SITE_CONTENT).toBe('site-content');
    expect(TAG_SETTINGS).toBe('settings');
  });

  it('listPublicTurfs returns active turfs with availability count', async () => {
    const turfs = await listPublicTurfs();
    expect(Array.isArray(turfs)).toBe(true);
    expect(turfs.length).toBeGreaterThan(0);
    const first = turfs[0];
    expect(first.status).toBe('active');
    expect(typeof first.availableToday).toBe('number');
  });

  it('getPublicTurf returns a public turf by id or null if not found', async () => {
    const turfs = await listPublicTurfs();
    const first = turfs[0];
    const found = await getPublicTurf(first.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(first.id);

    const missing = await getPublicTurf('non-existent-turf-id');
    expect(missing).toBeNull();
  });

  it('listAreas extracts sorted unique area names', async () => {
    const turfs = await listPublicTurfs();
    const areas = listAreas(turfs);
    expect(Array.isArray(areas)).toBe(true);
    expect(areas.length).toBeGreaterThan(0);
    const sorted = [...areas].sort();
    expect(areas).toEqual(sorted);
  });

  it('getSiteContent returns the site object', async () => {
    const site = await getSiteContent();
    expect(site).toBeDefined();
    expect(typeof site.heroTitle).toBe('string');
  });

  it('getSettings returns platform settings', async () => {
    const settings = await getSettings();
    expect(settings).toBeDefined();
    expect(typeof settings.supportEmail).toBe('string');
  });

  it('refreshAll invalidates public cache tags and layout path without throwing', () => {
    expect(() => refreshAll()).not.toThrow();
  });
});
