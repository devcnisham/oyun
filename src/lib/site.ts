// Public site identity used for canonical URLs, sitemap, Open Graph and schema markup.

function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, '');
  // Set automatically on Vercel to the production domain
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return 'http://localhost:3000';
}

export const SITE_URL = siteUrl();
export const SITE_NAME = 'OYUN';
export const SITE_CITY = 'Mangalore';
export const SITE_TAGLINE = 'Book turfs and courts in Mangalore';
export const SITE_DESCRIPTION =
  'Book football and box cricket turfs and badminton, pickleball and padel courts in Mangalore. See live slot availability and prices and book in seconds. Kodialbail, Kankanady, Ullal and more.';

export const absoluteUrl = (path = '/') => new URL(path, `${SITE_URL}/`).toString();

// URL-safe slug for an area name, e.g. "Bejai Main Road" -> "bejai-main-road"
export const areaSlug = (area: string) => area.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
