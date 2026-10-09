// Slows down password guessing on the admin and partner logins (task P9-07).
//
// Two counters, both forgotten after a quiet window:
//  - per role + email + IP: five wrong passwords lock that email for that IP. Someone elsewhere cannot lock
//    the real admin out, because their failures are counted against their own IP.
//  - per role + IP: many wrong tries from one IP across any emails (password spraying) lock that IP.
// Held in memory, so each server instance counts separately; P9-06 moves this to a shared store.

export interface ThrottleOptions {
  maxFailures?: number; // per email and IP
  maxFailuresPerIp?: number; // per IP, across emails
  windowMs?: number; // how long after the last failure a lock lasts
  maxEntries?: number; // memory cap
  now?: () => number;
}

interface Entry {
  count: number;
  last: number;
}

export function createLoginThrottle({ maxFailures = 5, maxFailuresPerIp = 20, windowMs = 15 * 60 * 1000, maxEntries = 10_000, now = Date.now }: ThrottleOptions = {}) {
  const entries = new Map<string, Entry>();

  const keys = (role: string, email: string, ip: string) => [`acct:${role}:${email}:${ip}`, `ip:${role}:${ip}`] as const;

  function live(key: string) {
    const e = entries.get(key);
    if (!e) return undefined;
    if (now() - e.last > windowMs) {
      entries.delete(key);
      return undefined;
    }
    return e;
  }

  return {
    // True while this email from this IP, or this IP overall, is locked
    isLocked(role: string, email: string, ip: string) {
      const [acct, byIp] = keys(role, email, ip);
      return (live(acct)?.count ?? 0) >= maxFailures || (live(byIp)?.count ?? 0) >= maxFailuresPerIp;
    },
    recordFailure(role: string, email: string, ip: string) {
      for (const key of keys(role, email, ip)) {
        const e = live(key) ?? { count: 0, last: 0 };
        e.count += 1;
        e.last = now();
        entries.set(key, e);
      }
      if (entries.size > maxEntries) entries.delete(entries.keys().next().value!);
    },
    // A correct password clears this email's count for this IP; the per-IP count keeps running
    recordSuccess(role: string, email: string, ip: string) {
      entries.delete(keys(role, email, ip)[0]);
    },
  };
}
