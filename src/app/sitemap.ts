import type { MetadataRoute } from 'next';
import { CURATED_COLLECTIONS } from '@/lib/curated-collections';
import { GUIDES } from '@/lib/guides-content';
import { listAreas, listPublicTurfs } from '@/lib/queries';
import { localizedPagesIndexed } from '@/lib/localized-home';
import { PRICE_BANDS, bandSlug } from '@/lib/price-bands';
import { isIndexableTurf, showCountdownInSitemap } from '@/lib/seo';
import { absoluteUrl, areaSlug } from '@/lib/site';
import { SPORTS, sportSlug } from '@/lib/sports';

// Built per request from the live database, so new turfs appear without a deploy
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const turfs = (await listPublicTurfs()).filter(isIndexableTurf);
  // Newest content change, not "now": a date that moves on every request tells crawlers nothing
  const now = new Date(Math.max(...turfs.map((t) => new Date(t.createdAt).getTime()), ...GUIDES.map((g) => new Date(g.publishedAt).getTime())));

  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/arenas'), lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: absoluteUrl('/areas'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/sports'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/offers'), lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: absoluteUrl('/events'), lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: absoluteUrl('/membership'), lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    ...(localizedPagesIndexed()
      ? [
          { url: absoluteUrl('/kn'), lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 },
          { url: absoluteUrl('/hi'), lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 },
        ]
      : []),
    { url: absoluteUrl('/guides'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    ...(showCountdownInSitemap() ? [{ url: absoluteUrl('/countdown'), lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 }] : []),
    { url: absoluteUrl('/matches'), lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: absoluteUrl('/tournaments'), lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: absoluteUrl('/about'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/list-turf'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/help'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/faq'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/terms'), lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: absoluteUrl('/privacy'), lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const bandPages = PRICE_BANDS.filter((b) => turfs.some((t) => t.pricePerHour <= b)).map((b) => ({
    url: absoluteUrl(`/prices/${bandSlug(b)}`),
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  const areas = listAreas(turfs).map((area) => ({
    url: absoluteUrl(`/turfs/${areaSlug(area)}`),
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const sportPages = SPORTS.map((s) => ({
    url: absoluteUrl(`/sports/${sportSlug(s.value)}`),
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const intersectionPages = SPORTS.flatMap((s) => {
    const sSlug = sportSlug(s.value);
    const sportTurfs = turfs.filter((t) => t.sports.some((x) => sportSlug(x) === sSlug));
    const sportAreas = listAreas(sportTurfs);
    return sportAreas.map((area) => ({
      url: absoluteUrl(`/sports/${sSlug}/${areaSlug(area)}`),
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.75,
    }));
  });

  const curatedPages = CURATED_COLLECTIONS.map((c) => ({
    url: absoluteUrl(`/curated/${c.slug}`),
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const guidePages = GUIDES.map((g) => ({
    url: absoluteUrl(`/guides/${g.slug}`),
    lastModified: new Date(g.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const turfPages = turfs.map((t) => ({
    url: absoluteUrl(`/arenas/${t.id}`),
    lastModified: new Date(t.createdAt),
    changeFrequency: 'daily' as const,
    priority: 0.8,
    images: t.images.slice(0, 3).map((src) => absoluteUrl(src)),
  }));

  return [...pages, ...bandPages, ...areas, ...sportPages, ...intersectionPages, ...curatedPages, ...guidePages, ...turfPages];
}
