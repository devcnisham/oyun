// Rules for admin-managed homepage images and links. Pure, so the server action and tests share them.

export const MAX_SPONSOR_ADS = 8;

// next/image only loads files from /public or images.unsplash.com (next.config.ts remotePatterns)
export function isAllowedImage(src: string): boolean {
  return src.startsWith('https://images.unsplash.com/') || (src.startsWith('/') && !src.startsWith('//'));
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
