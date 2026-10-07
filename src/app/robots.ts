import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Read the site URL at request time, not build time
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private dashboards, personal booking pages and server endpoints
        disallow: ['/admin', '/partner', '/bookings', '/profile', '/settings', '/api/', '/*?*ref='],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
