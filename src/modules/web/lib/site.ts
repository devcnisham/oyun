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
export const SITE_DESCRIPTION =
  'Book football, box cricket, badminton and pickleball venues in Mangalore. Compare prices, see live availability and book a slot.';

export const absoluteUrl = (path = '/') => new URL(path, `${SITE_URL}/`).toString();

// URL-safe slug for an area name, e.g. "Bejai Main Road" -> "bejai-main-road"
export const areaSlug = (area: string) => area.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Footer social links. Set these in the environment; a link with no URL is not shown, so the footer never has dead "#" links.
const clean = (v: string | undefined) => (v && /^https?:\/\//.test(v) ? v : null);
export const SOCIAL_LINKS = {
  instagram: clean(process.env.NEXT_PUBLIC_INSTAGRAM_URL),
  whatsapp: clean(process.env.NEXT_PUBLIC_WHATSAPP_URL),
};
