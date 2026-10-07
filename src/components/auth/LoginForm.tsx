'use client';

import { useActionState, useRef } from 'react';
import { login } from '@/lib/auth-actions';
import type { Role } from '@/lib/session';
import styles from './LoginScreen.module.css';

interface LoginFormProps {
  role: Role;
  emailPlaceholder: string;
}

export default function LoginForm({ role, emailPlaceholder }: LoginFormProps) {
  const [loginState, formAction, loginPending] = useActionState(login.bind(null, role), undefined);
  const error = loginState?.error;
  const formRef = useRef<HTMLFormElement>(null);

  const handleDemoLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    if (formRef.current) {
      const emailInput = formRef.current.elements.namedItem('email') as HTMLInputElement;
      const passInput = formRef.current.elements.namedItem('password') as HTMLInputElement;
      if (emailInput && passInput) {
        emailInput.value = role === 'admin' ? 'admin@oyun.in' : 'partners@oyun.in';
        passInput.value = role === 'admin' ? '@123admin' : '@123partner';
        formRef.current.requestSubmit();
      }
    }
  };

  return (
    <form ref={formRef} action={formAction} className={styles.loginForm}>
      <div className={styles.inputGroup}>
        <label htmlFor="email">Email Address</label>
        <input type="email" id="email" name="email" required autoComplete="username" placeholder={emailPlaceholder} className={styles.input} />
      </div>

      <div className={styles.inputGroup}>
        <div className={styles.passwordLabelRow}>
          <label htmlFor="password">Password</label>
          <a href="mailto:hello@oyun.in?subject=Reset%20my%20OYUN%20dashboard%20password" className={styles.forgotLink}>Forgot password?</a>
        </div>
        <input type="password" id="password" name="password" required autoComplete="current-password" placeholder="••••••••" className={styles.input} />
      </div>

      {error && (
        <p role="alert" style={{ color: '#b00020', fontSize: '14px', margin: 0 }}>{error}</p>
      )}

      <button type="submit" className={styles.loginBtn} disabled={loginPending}>
        {loginPending ? 'Signing in…' : 'Sign In to Dashboard'}
      </button>
      
      <button type="button" onClick={handleDemoLogin} className={styles.demoBtn} disabled={loginPending}>
        {role === 'admin' ? 'View Admin Demo' : 'View Partner Demo'}
      </button>

    </form>
  );
}
