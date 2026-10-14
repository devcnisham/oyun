// Rules for admin-managed homepage images and links. Pure, so the server action and tests share them.

export const MAX_SPONSOR_ADS = 8;

// next/image only loads files from /public, images.unsplash.com, or Supabase Storage (next.config.ts remotePatterns)
export function isAllowedImage(src: string): boolean {
  return (
    src.startsWith('https://images.unsplash.com/') ||
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//.test(src) ||
    (src.startsWith('/') && !src.startsWith('//'))
  );
}

// Ad links: an https page or a path on this site. Never javascript:, data:, http: or protocol-relative //host.
export function isAllowedAdLink(link: string): boolean {
  if (link.startsWith('/')) return !link.startsWith('//') && !link.includes('\\');
  try {
    const url = new URL(link);
    return url.protocol === 'https:' && url.hostname.includes('.') && !url.username && !url.password;
  } catch {
    return false;
  }
}

export const MAX_TURF_IMAGES = 10;
const MAX_IMAGE_URL_LENGTH = 500;

// Turf photos entered by an owner or admin: a file on this site (/turfs/x.jpg) or a plain https link.
// Refused: protocol-relative //host, backslash tricks, http:, javascript: and data: links, links with a
// username or password, and hosts without a dot (localhost, internal names). Any public https host is
// allowed on purpose, since owners paste links from their own image host; those are shown unoptimized.
export function isSafeTurfImage(src: string): boolean {
  if (!src || src.length > MAX_IMAGE_URL_LENGTH || /[\\\s\u0000-\u001f]/.test(src)) return false;
  if (src.startsWith('/')) return !src.startsWith('//');
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && url.hostname.includes('.') && !url.username && !url.password;
  } catch {
    return false;
  }
}
