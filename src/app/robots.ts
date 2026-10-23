import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { roleForHost } from '@/modules/shared/backend/hosts';
import { SITE_URL } from '@/modules/web/lib/site';

// Read the site URL and the requesting host at request time, not build time
export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const role = roleForHost(h.get('x-forwarded-host') ?? h.get('host'));
  // Only www is indexed. app., book., help., partner. and admin. redirect or hold dashboards: keep crawlers out.
  if (role && role !== 'landing') return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private dashboards, personal pages, sign-in and server endpoints
        disallow: ['/admin', '/partner', '/bookings', '/profile', '/settings', '/saved', '/api/', '/*?*ref='],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
