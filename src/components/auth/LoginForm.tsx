'use client';

import { useActionState } from 'react';
import { demoLogin, login } from '@/lib/auth-actions';
import type { Role } from '@/lib/session';
import styles from './LoginScreen.module.css';

interface LoginFormProps {
  role: Role;
  emailPlaceholder: string;
  demoEnabled: boolean;
}

export default function LoginForm({ role, emailPlaceholder, demoEnabled }: LoginFormProps) {
  const [loginState, formAction, loginPending] = useActionState(login.bind(null, role), undefined);
  const [demoState, demoAction, demoPending] = useActionState(demoLogin.bind(null, role), undefined);
  const pending = loginPending || demoPending;
  const error = loginState?.error ?? demoState?.error;

  return (
    <form action={formAction} className={styles.loginForm}>
      <div className={styles.inputGroup}>
        <label htmlFor="email">Email Address</label>
        <input type="email" id="email" name="email" required autoComplete="username" placeholder={emailPlaceholder} className={styles.input} />
      </div>

      <div className={styles.inputGroup}>
        <div className={styles.passwordLabelRow}>
          <label htmlFor="password">Password</label>
          <a href="#" className={styles.forgotLink}>Forgot password?</a>
        </div>
        <input type="password" id="password" name="password" required autoComplete="current-password" placeholder="••••••••" className={styles.input} />
      </div>

      {error && (
        <p role="alert" style={{ color: '#b00020', fontSize: '14px', margin: 0 }}>{error}</p>
      )}

      <button type="submit" className={styles.loginBtn} disabled={pending}>
        {loginPending ? 'Signing in…' : 'Sign In to Dashboard'}
      </button>

      {demoEnabled && (
        <button
          type="submit"
          formAction={demoAction}
          formNoValidate
          className={`${styles.loginBtn} ${styles.demoBtn}`}
          disabled={pending}
        >
          {demoPending ? 'Opening demo…' : 'See Demo'}
        </button>
      )}
    </form>
  );
}
