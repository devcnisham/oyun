/*
 * Fixed-window rate limiter kept in memory. Per server instance, so on serverless it
 * slows abuse rather than stopping it outright; pair with Vercel Firewall rules for that.
 */
const windows = new Map<string, { count: number; resetAt: number }>();

// Periodically sweep expired windows to prevent unbounded memory growth.
// 60-second interval is safe: expired windows are also cleaned up on every new key hit.
if (typeof setInterval !== 'undefined') {
  const sweep = () => {
    const now = Date.now();
    for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
  };
  const timer = setInterval(sweep, 60_000);
  // Don't prevent the process from exiting in test environments.
  if (typeof timer === 'object' && timer !== null && 'unref' in timer) (timer as NodeJS.Timeout).unref();
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const w = windows.get(key);
  if (!w || w.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    // Emergency hard cap: if map is enormous despite the interval, force a sweep.
    if (windows.size > 20_000) {
      for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
    }
    return true;
  }
  w.count++;
  return w.count <= limit;
}
