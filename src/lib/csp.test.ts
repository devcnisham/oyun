import { describe, expect, test } from 'vitest';
import { buildCsp } from './csp';

describe('Content Security Policy (CSP)', () => {
  test('static CSP includes unsafe-inline when no nonce is provided', () => {
    const csp = buildCsp(undefined, false);
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'strict-dynamic'");
    expect(csp).not.toContain("'nonce-");
  });

  test('nonce-based CSP uses a nonce without strict-dynamic (so host-listed loaders like Clerk still run), dropping unsafe-inline from script-src', () => {
    const nonce = 'test-nonce-12345';
    const csp = buildCsp(nonce, false);
    const scriptSrc = csp.split(';').find((s) => s.trim().startsWith('script-src')) ?? '';
    expect(scriptSrc).toContain(`'nonce-${nonce}'`);
    expect(scriptSrc).not.toContain("'strict-dynamic'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  test('development mode includes unsafe-eval for React debugging', () => {
    const cspDev = buildCsp('dev-nonce', true);
    expect(cspDev).toContain("'unsafe-eval'");

    const cspProd = buildCsp('prod-nonce', false);
    expect(cspProd).not.toContain("'unsafe-eval'");
  });

  test('allows no frames without Clerk, since maps are drawn on the page and not embedded', () => {
    const frameSrc = buildCsp('abc', false).split(';').find((d) => d.trim().startsWith('frame-src')) ?? '';
    expect(frameSrc.trim()).toBe("frame-src 'none'");
  });
});
