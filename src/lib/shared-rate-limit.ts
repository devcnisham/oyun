import 'server-only';
import { createAdminClient, supabaseConfigured } from '@/utils/supabase/admin';
import { createLoginThrottle } from './login-throttle';
import { rateLimit } from './rate-limit';

/*
 * Rate limits shared by every server instance (task P9-06). The counters live in Postgres
 * (rl_hit / rl_get / rl_clear, supabase/setup/8-rate-limits.sql), so a burst that lands on
 * several serverless instances is still counted together.
 *
 * Without Supabase, or if the database call fails (or step 8 has not been run yet), this falls
 * back to the per-instance in-memory limiters: slower to react, never a reason to refuse a player.
 */

type Rpc = { data: unknown; error: { message: string } | null };

const memoryLogin = createLoginThrottle();
let warned = false;

async function call(fn: 'rl_hit' | 'rl_get' | 'rl_clear', args: Record<string, unknown>): Promise<number | null> {
  if (!supabaseConfigured()) return null;
  try {
    const { data, error } = (await createAdminClient().rpc(fn, args)) as Rpc;
    if (error) throw new Error(error.message);
    return typeof data === 'number' ? data : Number(data ?? 0);
  } catch (err) {
    if (!warned) {
      warned = true;
      console.error(JSON.stringify({ level: 'warn', message: `shared rate limit unavailable, using per-instance counters: ${(err as Error).message}` }));
    }
    return null;
  }
}

/** True while `key` is within `limit` hits per window. Fixed window from the first hit. */
export async function sharedRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const count = await call('rl_hit', { p_key: key, p_window_ms: windowMs, p_sliding: false });
  return count === null ? rateLimit(key, limit, windowMs) : count <= limit;
}

// Same rules as createLoginThrottle (login-throttle.ts), kept in Postgres
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_ACCOUNT = 5;
const MAX_PER_IP = 20;
const acctKey = (role: string, email: string, ip: string) => `login:acct:${role}:${email}:${ip}`;
const ipKey = (role: string, ip: string) => `login:ip:${role}:${ip}`;

export const sharedLoginThrottle = {
  async isLocked(role: string, email: string, ip: string): Promise<boolean> {
    const [acct, byIp] = await Promise.all([
      call('rl_get', { p_key: acctKey(role, email, ip), p_window_ms: WINDOW_MS, p_sliding: true }),
      call('rl_get', { p_key: ipKey(role, ip), p_window_ms: WINDOW_MS, p_sliding: true }),
    ]);
    if (acct === null || byIp === null) return memoryLogin.isLocked(role, email, ip);
    return acct >= MAX_PER_ACCOUNT || byIp >= MAX_PER_IP;
  },
  async recordFailure(role: string, email: string, ip: string): Promise<void> {
    // The in-memory copy is always updated too, so a database outage does not switch the lock off
    memoryLogin.recordFailure(role, email, ip);
    await Promise.all([
      call('rl_hit', { p_key: acctKey(role, email, ip), p_window_ms: WINDOW_MS, p_sliding: true }),
      call('rl_hit', { p_key: ipKey(role, ip), p_window_ms: WINDOW_MS, p_sliding: true }),
    ]);
  },
  // A correct password clears this email's count for this IP; the per-IP count keeps running
  async recordSuccess(role: string, email: string, ip: string): Promise<void> {
    memoryLogin.recordSuccess(role, email, ip);
    await call('rl_clear', { p_key: acctKey(role, email, ip) });
  },
};
