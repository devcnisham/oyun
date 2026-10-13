import { describe, expect, test } from 'vitest';
import { buildCsp } from './csp';

describe('Content Security Policy (P9-13)', () => {
  test('generates nonce-based script-src and drops unsafe-inline', () => {
    const nonce = 'test-nonce-12345';
    const csp = buildCsp(nonce);

    expect(csp).toContain(`'nonce-${nonce}'`);
    expect(csp).toContain("'strict-dynamic'");

    const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src'));
    expect(scriptSrc).toBeDefined();
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  test('includes required connect and frame sources', () => {
    const csp = buildCsp('random-nonce');
    expect(csp).toContain('https://*.supabase.co');
    expect(csp).toContain('https://www.googletagmanager.com');
    expect(csp).toContain('https://va.vercel-scripts.com');
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("object-src 'none'");
  });
});
