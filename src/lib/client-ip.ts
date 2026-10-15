// The caller's address for rate limits. The first x-forwarded-for hop is client-supplied and can be
// rotated freely to dodge a limit, so prefer the headers the platform sets itself, then the last hop
// (the one our nearest proxy appended).
export function clientIpFrom(headers: Pick<Headers, 'get'>): string {
  const platform = headers.get('x-real-ip') || headers.get('x-vercel-forwarded-for');
  if (platform?.trim()) return platform.trim();
  const hops = headers.get('x-forwarded-for')?.split(',').map((h) => h.trim()).filter(Boolean);
  return hops?.[hops.length - 1] || 'unknown';
}
