import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const SECRET = 'whsec_v2_test_secret';
const payload = JSON.stringify({
  event: 'payment.captured',
  payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1', amount: 50000, status: 'captured', notes: { booking_id: 'bk_1' } } } },
});
const sign = () => crypto.createHmac('sha256', SECRET).update(payload).digest('hex');

// A database whose confirm_payment answers `confirm`, and which records every call
function load(flag: string, confirm: { data?: unknown; error?: { message: string } | null }) {
  const calls: string[] = [];
  const claimed = new Set<string>();
  const client = {
    rpc: vi.fn(async (fn: string, args?: { p_event_key?: string }) => {
      calls.push(fn);
      if (fn === 'claim_payment_event') {
        const key = args!.p_event_key!;
        if (claimed.has(key)) return { data: false, error: null };
        claimed.add(key);
        return { data: true, error: null };
      }
      if (fn === 'release_payment_event') {
        claimed.delete(args!.p_event_key!);
        return { data: null, error: null };
      }
      if (fn === 'confirm_payment') return { data: confirm.data ?? null, error: confirm.error ?? null };
      return { data: null, error: { message: `unexpected ${fn}` } };
    }),
  };
  vi.resetModules();
  vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', SECRET);
  vi.stubEnv('OYUN_V2_SLOTS', flag);
  vi.doMock('@/modules/shared/database/supabase/admin', () => ({ supabaseConfigured: () => true, createAdminClient: () => client }));
  vi.doMock('@/modules/shared/database/store', () => ({ v2SlotsEnabled: () => flag === '1' }));
  return { calls, client, claimed };
}

describe('webhook confirm failures with v2 slots', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock('@/modules/shared/database/supabase/admin');
    vi.doUnmock('@/modules/shared/database/store');
  });

  test('a database error gives the event back and asks the gateway to retry', async () => {
    const { calls, claimed } = load('1', { error: { message: 'connection terminated' } });
    const { processPaymentWebhook } = await import('@/modules/web/backend/payments');
    const res = await processPaymentWebhook(payload, sign());
    expect(res).toMatchObject({ ok: false, error: 'confirm_failed', retryable: true });
    expect(calls).toEqual(['claim_payment_event', 'confirm_payment', 'release_payment_event']);
    expect(claimed.size).toBe(0);
  });

  test('the retry is then processed, not ignored as a duplicate', async () => {
    const first = load('1', { error: { message: 'boom' } });
    const { processPaymentWebhook } = await import('@/modules/web/backend/payments');
    await processPaymentWebhook(payload, sign());
    expect(first.claimed.size).toBe(0);
    // the same database now confirms
    const second = load('1', { data: 'confirmed' });
    const again = await (await import('@/modules/web/backend/payments')).processPaymentWebhook(payload, sign());
    expect(again).toMatchObject({ ok: true, action: 'confirmed' });
    expect(second.calls).toContain('confirm_payment');
  });

  test('a confirmed payment stays claimed so a replay is ignored', async () => {
    const { claimed } = load('1', { data: 'confirmed' });
    const { processPaymentWebhook } = await import('@/modules/web/backend/payments');
    expect(await processPaymentWebhook(payload, sign())).toMatchObject({ ok: true, action: 'confirmed' });
    expect(claimed.size).toBe(1);
    expect(await processPaymentWebhook(payload, sign())).toMatchObject({ ok: true, action: 'already_confirmed' });
  });

  test('with v2 slots off the old memory fallback still applies', async () => {
    load('', { error: { message: 'payment_not_found' } });
    const { processPaymentWebhook } = await import('@/modules/web/backend/payments');
    expect(await processPaymentWebhook(payload, sign())).toMatchObject({ ok: true, action: 'confirmed' });
  });
});
