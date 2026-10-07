'use client';

import { useActionState } from 'react';
import { login } from '@/lib/auth-actions';
import type { Role } from '@/lib/session';
import styles from './LoginScreen.module.css';

interface LoginFormProps {
  role: Role;
}

export default function LoginForm({ role }: LoginFormProps) {
  const [loginState, formAction, loginPending] = useActionState(login.bind(null, role), undefined);
  const error = loginState?.error;

  return (
    <form action={formAction} className={styles.loginForm}>
      {/* Hidden inputs to bypass the need for actual credentials */}
      <input type="hidden" name="email" value={role === 'admin' ? 'admin@oyun.in' : 'partners@oyun.in'} />
      <input type="hidden" name="password" value={role === 'admin' ? '@123admin' : '@123partner'} />

      {error && (
        <p role="alert" style={{ color: '#b00020', fontSize: '14px', margin: 0 }}>{error}</p>
      )}

      <button type="submit" className={styles.loginBtn} disabled={loginPending}>
        {loginPending ? 'Entering…' : 'Enter Dashboard'}
      </button>
    </form>
  );
}
