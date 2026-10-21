import type { Turf } from '@/lib/types';
import { isLaunched } from '@/lib/hosts';
import { SITE_NAME } from '@/lib/site';

// Test and placeholder venues must not be indexed: they are not real places a visitor can book.
const TEST_TURF_IDS = new Set(['oyun-club-test']);
export const isIndexableTurf = (t: Pick<Turf, 'id' | 'location'>) => !TEST_TURF_IDS.has(t.id) && !/demo address/i.test(t.location);

// The countdown page only has a purpose before launch, so it leaves the sitemap afterwards.
export const showCountdownInSitemap = () => !isLaunched();

// Next.js replaces (does not merge) a page's openGraph object, so every page that sets one must repeat the site-wide fields.
export const ogBase = (path: string) => ({ type: 'website' as const, locale: 'en_IN', siteName: SITE_NAME, url: path });
