import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

type FetchEvent = {
  request: { method: string; url: string; mode: string };
  respondWith: (p: Promise<unknown>) => void;
};

// Loads public/sw.js with stubbed browser globals and returns its fetch listener
function loadFetchHandler(cached: Record<string, string>, fetchFails: boolean) {
  const listeners: Record<string, (e: FetchEvent) => void> = {};
  const sandbox = {
    self: {
      location: { origin: 'https://oyun.test' },
      addEventListener: (name: string, fn: (e: FetchEvent) => void) => {
        listeners[name] = fn;
      },
    },
    caches: {
      match: async (req: string | { url: string }) =>
        cached[typeof req === 'string' ? req : new URL(req.url).pathname],
      open: async () => ({ put: async () => {}, addAll: async () => {} }),
    },
    fetch: async () => {
      if (fetchFails) throw new TypeError('offline');
      return { status: 200, clone: () => ({}) };
    },
    Response: { error: () => 'network-error' },
    URL,
  };
  runInNewContext(readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8'), sandbox);
  return listeners.fetch;
}

async function dispatch(handler: (e: FetchEvent) => void, url: string, mode: string) {
  let result: Promise<unknown> | undefined;
  handler({
    request: { method: 'GET', url, mode },
    respondWith: (p) => {
      result = p;
    },
  });
  return result === undefined ? undefined : await result;
}

describe('service worker fetch handler', () => {
  it('falls back to the cached home page for offline navigations', async () => {
    const handler = loadFetchHandler({ '/': 'home-html' }, true);
    expect(await dispatch(handler, 'https://oyun.test/arenas', 'navigate')).toBe('home-html');
  });

  it('does not serve home page HTML for a failed API request', async () => {
    const handler = loadFetchHandler({ '/': 'home-html' }, true);
    expect(await dispatch(handler, 'https://oyun.test/api/slots', 'cors')).toBe('network-error');
  });

  it('ignores cross-origin requests', async () => {
    const handler = loadFetchHandler({}, true);
    expect(await dispatch(handler, 'https://clerk.example/v1/client', 'cors')).toBeUndefined();
  });
});
