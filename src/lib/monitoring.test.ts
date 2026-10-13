import { afterEach, describe, expect, test, vi } from 'vitest';
import { reportError } from './monitoring';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('error webhook', () => {
  test('a client-supplied message cannot ping a channel', async () => {
    vi.stubEnv('ERROR_WEBHOOK_URL', 'https://hooks.example.test/x');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null));

    await reportError({ source: 'client', message: '@everyone <!channel> <@U123> boom', path: '/a?<!here>' });

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.allowed_mentions).toEqual({ parse: [] });
    expect(body.text).not.toMatch(/@everyone|<!channel>|<@U123>|<!here>/);
    expect(body.text).toContain('boom');
  });
});
