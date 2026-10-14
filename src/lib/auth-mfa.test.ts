import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { login } from './auth-actions';
import { generateTotp } from './totp';

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get: (k: string) => (k === 'x-forwarded-for' ? '127.0.0.1' : null),
  })),
  cookies: vi.fn(async () => ({
    set: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  })),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

describe('Admin MFA, per-user accounts and session revocation (P9-09)', () => {
  const mfaSecret = 'JBSWY3DPEHPK3PXP';

  beforeEach(() => {
    vi.stubEnv('SESSION_SECRET', 'super-secret-key-32-chars-length-at-least');
    vi.stubEnv('ADMIN_EMAIL', 'admin@oyun.test');
    vi.stubEnv('ADMIN_PASSWORD', 'AdminPassword123!');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('signs in successfully without MFA when MFA is not configured', async () => {
    const formData = new FormData();
    formData.append('email', 'admin@oyun.test');
    formData.append('password', 'AdminPassword123!');

    await expect(login('admin', undefined, formData)).rejects.toThrow('REDIRECT:/admin');
  });

  test('requires valid TOTP code when ADMIN_MFA_SECRET is configured', async () => {
    vi.stubEnv('ADMIN_MFA_SECRET', mfaSecret);

    const formDataNoMfa = new FormData();
    formDataNoMfa.append('email', 'admin@oyun.test');
    formDataNoMfa.append('password', 'AdminPassword123!');

    const resFail = await login('admin', undefined, formDataNoMfa);
    expect(resFail?.error).toContain('Invalid email, password, or MFA code');

    const formDataWithMfa = new FormData();
    formDataWithMfa.append('email', 'admin@oyun.test');
    formDataWithMfa.append('password', 'AdminPassword123!');
    formDataWithMfa.append('totpCode', generateTotp(mfaSecret));

    await expect(login('admin', undefined, formDataWithMfa)).rejects.toThrow('REDIRECT:/admin');
  });

  test('supports per-user admin accounts via ADMIN_USERS', async () => {
    const adminUsers = [
      { id: 'ops_1', email: 'ops@oyun.test', password: 'OpsSecretPassword1!', mfaSecret },
    ];
    vi.stubEnv('ADMIN_USERS', JSON.stringify(adminUsers));

    const formData = new FormData();
    formData.append('email', 'ops@oyun.test');
    formData.append('password', 'OpsSecretPassword1!');
    formData.append('totpCode', generateTotp(mfaSecret));

    await expect(login('admin', undefined, formData)).rejects.toThrow('REDIRECT:/admin');
  });
});
