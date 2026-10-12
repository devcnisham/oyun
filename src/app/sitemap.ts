import type { MetadataRoute } from 'next';
import { listAreas, listPublicTurfs } from '@/lib/queries';
import { absoluteUrl, areaSlug } from '@/lib/site';

// Built per request from the live database, so new turfs appear without a deploy
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const turfs = await listPublicTurfs();
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/arenas'), lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: absoluteUrl('/welcome'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/list-turf'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/help'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/faq'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/terms'), lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: absoluteUrl('/privacy'), lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const areas = listAreas(turfs).map((area) => ({
    url: absoluteUrl(`/turfs/${areaSlug(area)}`),
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const turfPages = turfs.map((t) => ({
    url: absoluteUrl(`/arenas/${t.id}`),
    lastModified: new Date(t.createdAt),
    changeFrequency: 'daily' as const,
    priority: 0.8,
    images: t.images.slice(0, 3).map((src) => absoluteUrl(src)),
  }));

  return [...pages, ...areas, ...turfPages];
}
