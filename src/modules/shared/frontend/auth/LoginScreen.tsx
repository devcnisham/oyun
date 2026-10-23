import type { ReactNode } from 'react';
import Link from 'next/link';
import { connection } from 'next/server';
import type { Role } from '@/modules/shared/backend/session';
import LoginForm from '@/modules/shared/frontend/auth/LoginForm';
import styles from '@/modules/shared/frontend/auth/LoginScreen.module.css';

const copy = {
  admin: {
    tag: 'Admin Control Center',
    subtitle: 'Enter the admin portal',
    prompt: 'Are you a turf owner?',
    altHref: '/partner/login',
    altLabel: 'Go to Partner Portal',
  },
  partner: {
    tag: 'Partner Portal',
    subtitle: 'Enter the partner portal to manage your turf',
    prompt: 'Not a partner yet?',
    altHref: '/list-turf',
    altLabel: 'List your turf for free',
  },
};

// `social` is the Google / Apple block (Clerk), shown above the password form; `mode="signup"` shows only that block
export default async function LoginScreen({ role, social, mode = 'login' }: { role: Role; social?: ReactNode; mode?: 'login' | 'signup' }) {
  await connection(); // render per request (reads login settings at runtime)
  const c = copy[role];
  const signup = mode === 'signup';

  return (
    <div className={styles.loginContainer}>
      <div className={styles.leftPane}>
        <div className={styles.overlay}></div>
        <div className={styles.leftContent}>
          <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.logo} style={{ filter: 'drop-shadow(0 8px 16px rgba(100, 0, 0, 0.4))' }}>
            <circle cx="20" cy="20" r="18" fill="url(#loginShieldGrad)"/>
            <path d="M 12 12 L 18 22 L 27 16 L 31 19" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="32" cy="12" r="2.5" fill="white"/>
            <path d="M 14 28 Q 22 32 30 24" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M 10 23 Q 16 26 22 21" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <defs>
              <linearGradient id="loginShieldGrad" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9E0A0A"/>
                <stop offset="1" stopColor="#4A0000"/>
              </linearGradient>
            </defs>
          </svg>
          <h1 className={styles.brandTitle}>OYUN</h1>
          <p className={styles.brandTag}>{c.tag}</p>
        </div>
      </div>
      <div className={styles.rightPane}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <h2>{signup ? 'Create your partner account' : 'Welcome Back'}</h2>
            <p>{signup ? 'Sign up with Google or Apple. Your turf goes live once we approve your application.' : c.subtitle}</p>
          </div>

          {social}
          {social && !signup && <p className={styles.orLine}>or sign in with your email</p>}
          {!signup && <LoginForm role={role} />}

          <div className={styles.partnerPrompt}>
            <p>{signup ? 'Already approved?' : c.prompt}</p>
            <Link href={signup ? `/${role}/login` : c.altHref} className={styles.partnerLink}>{signup ? 'Sign in' : c.altLabel}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
