import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import styles from '../auth.module.css';

export const metadata: Metadata = { title: 'Log in', description: 'Log in to OYUN as a turf owner, staff member or admin.', alternates: { canonical: '/login' } };

export default function LoginPage() {
  return (
    <div className={styles.container}>
      {/* Left Image Panel (Desktop Only) */}
      <div className={styles.imagePanel}>
        <Image 
          src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2000&auto=format&fit=crop" 
          alt="Football Turf"
          fill
          className={styles.image}
        />
        <div className={styles.imageOverlay}>
          <div className={styles.brandLogo}>
            <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#fff"/>
              <path d="M 12 12 L 18 22 L 27 16 L 31 19" stroke="#EE2E24" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="32" cy="12" r="2.5" fill="#EE2E24"/>
            </svg>
            <span className={styles.logoName}>OYUN</span>
          </div>
          <p className={styles.brandTagline}>Your next game is just a tap away.</p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className={styles.formPanel}>
        <Link href="/" className={styles.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          Back
        </Link>

        <div className={styles.formWrapper}>
          <div className={styles.header}>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.subtitle}>Enter your details to access your account.</p>
          </div>

          <div className={styles.form}>
            <Link href="/partner/login" className={styles.submitBtn} style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Turf owner &amp; staff login
            </Link>
            <Link href="/admin/login" className={styles.submitBtn} style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: '#333', marginTop: '16px' }}>
              Admin login
            </Link>
          </div>

          <div className={styles.divider}>players</div>

          <p className={styles.subtitle} style={{ textAlign: 'center' }}>
            No account needed to book a turf: just pick a slot and enter your name and mobile number.
          </p>

          <Link href="/arenas" className={styles.socialBtn} style={{ textDecoration: 'none' }}>
            Browse turfs
          </Link>

          <p className={styles.footer}>
            Don&apos;t have an account? 
            <Link href="/signup" className={styles.footerLink}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
