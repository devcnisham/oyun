// Shared rate limits (P9-06): uses the database counters when Supabase is connected, and falls back to the
// per-instance limiters when it is not, or when the database call fails. The Supabase client is faked.
import { beforeEach, describe, expect, test, vi } from 'vitest';

const h = vi.hoisted(() => ({
  configured: true,
  counts: new Map<string, number>(),
  fail: false,
  calls: [] as { fn: string; args: Record<string, unknown> }[],
}));

vi.mock('@/modules/shared/database/supabase/admin', () => ({
  supabaseConfigured: () => h.configured,
  createAdminClient: () => ({
    rpc: async (fn: string, args: Record<string, unknown>) => {
      h.calls.push({ fn, args });
      if (h.fail) return { data: null, error: { message: 'function public.rl_hit does not exist' } };
      const key = String(args.p_key);
      if (fn === 'rl_hit') {
        h.counts.set(key, (h.counts.get(key) ?? 0) + 1);
        return { data: h.counts.get(key), error: null };
      }
      if (fn === 'rl_get') return { data: h.counts.get(key) ?? 0, error: null };
      h.counts.delete(key);
      return { data: null, error: null };
    },
  }),
}));

import { sharedLoginThrottle, sharedRateLimit } from '@/modules/shared/backend/shared-rate-limit';

beforeEach(() => {
  h.configured = true;
  h.fail = false;
  h.counts.clear();
  h.calls.length = 0;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('sharedRateLimit', () => {
  test('counts in the database and refuses once the limit is passed', async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await sharedRateLimit('hold:ip:1.2.3.4', 3, 60_000));
    expect(results).toEqual([true, true, true, false]);
    expect(h.calls.every((c) => c.fn === 'rl_hit' && c.args.p_window_ms === 60_000)).toBe(true);
  });

  test('another instance sees the same count (the counter is the database, not memory)', async () => {
    h.counts.set('apply:9.9.9.9', 5); // five hits recorded by other instances
    expect(await sharedRateLimit('apply:9.9.9.9', 5, 3_600_000)).toBe(false);
  });

  test('without Supabase it uses the in-memory limiter and never calls the database', async () => {
    h.configured = false;
    const results = [];
    for (let i = 0; i < 3; i++) results.push(await sharedRateLimit('local:key', 2, 60_000));
    expect(results).toEqual([true, true, false]);
    expect(h.calls).toHaveLength(0);
  });

  test('when the database call fails it falls back to memory instead of refusing players', async () => {
    h.fail = true;
    expect(await sharedRateLimit('fail:key', 1, 60_000)).toBe(true);
    expect(await sharedRateLimit('fail:key', 1, 60_000)).toBe(false); // still limited, per instance
  });
});

describe('sharedLoginThrottle', () => {
  test('locks an email from an IP after five failures, using sliding counters', async () => {
    for (let i = 0; i < 4; i++) await sharedLoginThrottle.recordFailure('admin', 'a@x.in', '1.1.1.1');
    expect(await sharedLoginThrottle.isLocked('admin', 'a@x.in', '1.1.1.1')).toBe(false);
    await sharedLoginThrottle.recordFailure('admin', 'a@x.in', '1.1.1.1');
    expect(await sharedLoginThrottle.isLocked('admin', 'a@x.in', '1.1.1.1')).toBe(true);
    expect(h.calls.filter((c) => c.fn === 'rl_hit').every((c) => c.args.p_sliding === true)).toBe(true);
  });

  test('another IP is not locked out by someone else failing, and success clears the account count', async () => {
    for (let i = 0; i < 5; i++) await sharedLoginThrottle.recordFailure('admin', 'b@x.in', '2.2.2.2');
    expect(await sharedLoginThrottle.isLocked('admin', 'b@x.in', '3.3.3.3')).toBe(false);
    await sharedLoginThrottle.recordSuccess('admin', 'b@x.in', '2.2.2.2');
    expect(await sharedLoginThrottle.isLocked('admin', 'b@x.in', '2.2.2.2')).toBe(false);
  });

  test('twenty failures from one IP across emails lock that IP', async () => {
    for (let i = 0; i < 20; i++) await sharedLoginThrottle.recordFailure('partner', `u${i}@x.in`, '4.4.4.4');
    expect(await sharedLoginThrottle.isLocked('partner', 'fresh@x.in', '4.4.4.4')).toBe(true);
  });

  test('with the database down the in-memory lock still works', async () => {
    h.fail = true;
    for (let i = 0; i < 5; i++) await sharedLoginThrottle.recordFailure('admin', 'c@x.in', '5.5.5.5');
    expect(await sharedLoginThrottle.isLocked('admin', 'c@x.in', '5.5.5.5')).toBe(true);
  });
});
