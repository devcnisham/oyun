import assert from 'node:assert/strict';
import { test } from 'node:test';
import { launchProblems, realtimeConfigured } from './launch-checks.ts';

const live = { storage: 'supabase', shared: true, realtime: true } as const;
const checks = (input: Parameters<typeof launchProblems>[0]) => launchProblems(input).map((p) => p.check);

test('a fully connected production site has no problems', () => {
  assert.deepEqual(launchProblems(live), []);
});

test('Vercel without Supabase fails storage, sharing and realtime', () => {
  assert.deepEqual(checks({ storage: 'local-file', shared: false, realtime: false }), [
    'storage',
    'bookingsSharedBetweenPlayers',
    'realtimeSlotUpdates',
  ]);
});

test('local-file storage is flagged even when it is shared (single dev server)', () => {
  assert.deepEqual(checks({ ...live, storage: 'local-file' }), ['storage']);
});

test('missing realtime alone is flagged', () => {
  assert.deepEqual(checks({ ...live, realtime: false }), ['realtimeSlotUpdates']);
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
  const text = JSON.stringify(launchProblems({ storage: 'local-file', shared: false, realtime: false }));
  assert.doesNotMatch(text, /sb_secret|sk_live|sk_test|eyJ/);
});
