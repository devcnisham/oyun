import Link from 'next/link';
import { connection } from 'next/server';
import type { Role } from '@/lib/session';
import LoginForm from './LoginForm';
import styles from './LoginScreen.module.css';

const copy = {
  admin: {
    tag: 'Admin Control Center',
    subtitle: 'Enter your credentials to access the admin portal',
    emailPlaceholder: 'admin@oyun.in',
    prompt: 'Are you a turf owner?',
    altHref: '/partner/login',
    altLabel: 'Go to Partner Portal',
  },
  partner: {
    tag: 'Partner Portal',
    subtitle: 'Enter your credentials to manage your turf',
    emailPlaceholder: 'owner@yourturf.in',
    prompt: 'Not a partner yet?',
    altHref: '/list-turf',
    altLabel: 'List your turf for free',
  },
};

export default async function LoginScreen({ role }: { role: Role }) {
  await connection(); // render per request (reads login settings at runtime)
  const c = copy[role];

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
            <h2>Welcome Back</h2>
            <p>{c.subtitle}</p>
          </div>

          <LoginForm role={role} emailPlaceholder={c.emailPlaceholder} />

          <div className={styles.partnerPrompt}>
            <p>{c.prompt}</p>
            <Link href={c.altHref} className={styles.partnerLink}>{c.altLabel}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
