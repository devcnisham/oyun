import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { GET as getPayoutsSettle } from './payouts/settle/route';
import { GET as getRetentionPurge, POST as postRetentionPurge } from './retention-purge/route';
import { NextRequest } from 'next/server';

describe('Cron route handlers', () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = 'test_cron_secret_key_123';
  });

  afterEach(() => {
    if (originalSecret !== undefined) {
      process.env.CRON_SECRET = originalSecret;
    } else {
      delete process.env.CRON_SECRET;
    }
  });

  test('refuses access when authorization header is missing or invalid', async () => {
    const unauthReq = new NextRequest('http://localhost:3000/api/cron/payouts/settle');
    const res = await getPayoutsSettle(unauthReq);
    expect(res.status).toBe(401);

    const unauthPurge = new NextRequest('http://localhost:3000/api/cron/retention-purge');
    const resPurge = await getRetentionPurge(unauthPurge);
    expect(resPurge.status).toBe(401);
  });

  test('succeeds when valid Bearer token is provided for payouts settle', async () => {
    const authReq = new NextRequest('http://localhost:3000/api/cron/payouts/settle', {
      headers: {
        authorization: 'Bearer test_cron_secret_key_123',
      },
    });
    const res = await getPayoutsSettle(authReq);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body).toHaveProperty('settlementDate');
    expect(body).toHaveProperty('period');
  });

  test('succeeds when valid Bearer token is provided for retention purge', async () => {
    const authReq = new NextRequest('http://localhost:3000/api/cron/retention-purge', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test_cron_secret_key_123',
      },
    });
    const res = await postRetentionPurge(authReq);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body).toHaveProperty('holdsPurged');
    expect(body).toHaveProperty('oldBookingsAnonymized');
  });
});
