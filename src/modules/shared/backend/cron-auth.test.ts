import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { requireCronSecret } from '@/modules/shared/backend/cron-auth';

const req = (authorization?: string) =>
  new Request('https://oyun.test/api/cron/x', { headers: authorization ? { authorization } : {} });

describe('requireCronSecret', () => {
  const original = process.env.CRON_SECRET;
  beforeEach(() => {
    delete process.env.CRON_SECRET;
  });
  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  });

  test('refuses everyone when no secret is configured (fails closed)', async () => {
    const res = requireCronSecret(req('Bearer anything'));
    expect(res?.status).toBe(503);
    expect(requireCronSecret(req())?.status).toBe(503);
  });

  test('an empty secret counts as not configured', () => {
    process.env.CRON_SECRET = '';
    expect(requireCronSecret(req('Bearer '))?.status).toBe(503);
  });

  test('rejects a missing or wrong header when the secret is set', () => {
    process.env.CRON_SECRET = 's3cret';
    expect(requireCronSecret(req())?.status).toBe(401);
    expect(requireCronSecret(req('Bearer wrong!'))?.status).toBe(401);
    expect(requireCronSecret(req('s3cret'))?.status).toBe(401);
    expect(requireCronSecret(req('Bearer s3cret-and-more'))?.status).toBe(401);
  });

  test('lets the right bearer token through', () => {
    process.env.CRON_SECRET = 's3cret';
    expect(requireCronSecret(req('Bearer s3cret'))).toBeNull();
  });
});
