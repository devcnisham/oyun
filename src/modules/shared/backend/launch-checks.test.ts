import assert from 'node:assert/strict';
import { test } from 'vitest';
import { launchProblems, loginChecks, realtimeConfigured } from '@/modules/shared/backend/launch-checks';

const logins = { adminLogin: true, partnerLogin: true, sessionSecretStrong: true, loginPasswordsStrong: true };
const live = { storage: 'supabase', shared: true, realtime: true, realtimeBroadcast: true, ...logins } as const;
const checks = (input: Parameters<typeof launchProblems>[0]) => launchProblems(input).map((p) => p.check);

test('a fully connected production site has no problems', () => {
  assert.deepEqual(launchProblems(live), []);
});

test('Vercel without Supabase fails storage, sharing and realtime', () => {
  assert.deepEqual(checks({ ...live, storage: 'local-file', shared: false, realtime: false }), [
    'storage',
    'bookingsSharedBetweenPlayers',
    'realtimeSlotUpdates',
  ]);
});

test('local-file storage is flagged even when it is shared (single dev server)', () => {
  assert.deepEqual(checks({ ...live, storage: 'local-file' }), ['storage']);
});

test('missing realtime alone is flagged', () => {
  assert.deepEqual(checks({ ...live, realtime: false, realtimeBroadcast: false }), ['realtimeSlotUpdates']);
});

test('configured realtime that cannot broadcast is flagged', () => {
  assert.deepEqual(checks({ ...live, realtimeBroadcast: false }), ['realtimeBroadcast']);
});

test('realtime needs all three Supabase variables', () => {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'pk',
    SUPABASE_SECRET_KEY: 'sk',
  };
  assert.equal(realtimeConfigured(env), true);
  for (const name of Object.keys(env)) {
    assert.equal(realtimeConfigured({ ...env, [name]: '' }), false, `${name} missing`);
  }
});

test('problem text never contains environment values', () => {
  const text = JSON.stringify(launchProblems({ storage: 'local-file', shared: false, realtime: false, realtimeBroadcast: false, adminLogin: false, partnerLogin: false, sessionSecretStrong: false, loginPasswordsStrong: false }));
  assert.doesNotMatch(text, /sb_secret|sk_live|sk_test|eyJ/);
});

const secret = 'x'.repeat(32);
const adminEnv = { ADMIN_EMAIL: 'admin@example.com', ADMIN_PASSWORD: 'long-enough-pass', SESSION_SECRET: secret };

test('admin login needs email, password and session secret', () => {
  assert.equal(loginChecks(adminEnv).adminLogin, true);
  for (const name of Object.keys(adminEnv)) {
    assert.equal(loginChecks({ ...adminEnv, [name]: undefined }).adminLogin, false, `${name} missing`);
  }
});

test('the operations partner login is optional and not a launch problem', () => {
  const result = loginChecks(adminEnv);
  assert.equal(result.partnerLogin, false);
  assert.deepEqual(checks({ ...live, ...result }), []);
  assert.equal(loginChecks({ ...adminEnv, PARTNER_EMAIL: 'ops@example.com', PARTNER_PASSWORD: 'another-long-pass' }).partnerLogin, true);
});

test('a missing admin login blocks launch', () => {
  assert.deepEqual(checks({ ...live, ...loginChecks({}) }), ['adminLogin', 'sessionSecretStrong']);
});

test('a short session secret blocks launch', () => {
  const result = loginChecks({ ...adminEnv, SESSION_SECRET: 'short' });
  assert.equal(result.adminLogin, true);
  assert.deepEqual(checks({ ...live, ...result }), ['sessionSecretStrong']);
});

test('short admin or operations passwords block launch', () => {
  assert.deepEqual(checks({ ...live, ...loginChecks({ ...adminEnv, ADMIN_PASSWORD: 'short' }) }), ['loginPasswordsStrong']);
  assert.deepEqual(
    checks({ ...live, ...loginChecks({ ...adminEnv, PARTNER_EMAIL: 'ops@example.com', PARTNER_PASSWORD: 'short' }) }),
    ['loginPasswordsStrong']
  );
});
