import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import styles from '../auth.module.css';

export const metadata: Metadata = { title: 'Get started', description: 'Start booking football turfs on OYUN, or list your own turf.', alternates: { canonical: '/signup' } };

export default function SignupPage() {
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
          <p className={styles.brandTagline}>Join India&apos;s premium turf booking platform.</p>
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
            <h1 className={styles.title}>Get started</h1>
            <p className={styles.subtitle}>Get started booking premium turfs instantly.</p>
          </div>

          <p className={styles.subtitle} style={{ textAlign: 'center' }}>
            Players don&apos;t need an account yet: book any turf with your name and mobile number.
          </p>

          <Link href="/arenas" className={styles.submitBtn} style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Browse turfs
          </Link>

          <div className={styles.divider}>own a turf?</div>

          <Link href="/list-turf" className={styles.socialBtn} style={{ textDecoration: 'none' }}>
            List your turf on OYUN
          </Link>

          <p className={styles.footer}>
            Already have an account? 
            <Link href="/login" className={styles.footerLink}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
