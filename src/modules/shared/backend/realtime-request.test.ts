import assert from 'node:assert/strict';
import { test } from 'vitest';
import { broadcastRequest } from '@/modules/shared/backend/realtime-request';

const messages = [{ topic: 'slots:t1:2026-10-09', event: 'changed', payload: { at: 1 } }];

test('posts to the realtime broadcast endpoint', () => {
  const { url, init } = broadcastRequest('https://abc.supabase.co/', 'sb_secret_x', messages);
  assert.equal(url, 'https://abc.supabase.co/realtime/v1/api/broadcast');
  assert.equal(init.method, 'POST');
  assert.deepEqual(JSON.parse(init.body), { messages });
});

test('new sb_secret keys go in apikey only', () => {
  const { init } = broadcastRequest('https://abc.supabase.co', 'sb_secret_x', messages);
  assert.equal(init.headers.apikey, 'sb_secret_x');
  assert.equal(init.headers.Authorization, undefined);
});

test('legacy JWT service keys are also sent as a bearer token', () => {
  const { init } = broadcastRequest('https://abc.supabase.co', 'eyJhbGciOi', messages);
  assert.equal(init.headers.Authorization, 'Bearer eyJhbGciOi');
});

test('the key never ends up in the request body', () => {
  const { init } = broadcastRequest('https://abc.supabase.co', 'sb_secret_x', messages);
  assert.doesNotMatch(init.body, /sb_secret_x/);
});
