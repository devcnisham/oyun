/*
 * Fixed-window rate limiter kept in memory. Per server instance, so on serverless it
 * slows abuse rather than stopping it outright; pair with Vercel Firewall rules for that.
 */
const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const w = windows.get(key);
  if (!w || w.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    if (windows.size > 20_000) {
      for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
    }
    return true;
  }
  w.count++;
  return w.count <= limit;
}
