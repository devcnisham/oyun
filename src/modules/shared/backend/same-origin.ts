// True when the request comes from one of our own pages. A cross-site page can make a signed-in visitor's
// browser send a POST with their cookies, so state-changing routes refuse a missing or foreign Origin.
export function isSameOrigin(headers: Pick<Headers, 'get'>): boolean {
  const origin = headers.get('origin');
  const host = headers.get('x-forwarded-host') ?? headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
