'use client';

import { useActionState, useState } from 'react';
import { login } from '@/lib/auth-actions';
import type { Role } from '@/lib/session';
import styles from './LoginScreen.module.css';

interface LoginFormProps {
  role: Role;
}

export default function LoginForm({ role }: LoginFormProps) {
  const [loginState, formAction, loginPending] = useActionState(login.bind(null, role), undefined);
  const error = loginState?.error;
  // Controlled so a wrong password does not wipe the email the person typed
  const [email, setEmail] = useState('');

  return (
    <form action={formAction} className={styles.loginForm}>
      <div className={styles.inputGroup}>
        <label htmlFor={`${role}-email`}>Email</label>
        <input id={`${role}-email`} name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" className={styles.input} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor={`${role}-password`}>Password</label>
        <input id={`${role}-password`} name="password" type="password" required autoComplete="current-password" className={styles.input} />
      </div>

      {error && (
        <p role="alert" style={{ color: 'var(--err)', fontSize: '14px', margin: 0 }}>{error}</p>
      )}

      <button type="submit" className={styles.loginBtn} disabled={loginPending}>
        {loginPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
