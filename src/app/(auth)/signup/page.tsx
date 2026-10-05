import Link from 'next/link';
import Image from 'next/image';
import styles from '../auth.module.css';

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
          <h1 className={styles.brandTagline}>Join India's premium turf booking platform.</h1>
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
            <h1 className={styles.title}>Create an account</h1>
            <p className={styles.subtitle}>Get started to book premium turfs instantly.</p>
          </div>

          <form className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="name">Full Name</label>
              <input type="text" id="name" className={styles.input} placeholder="John Doe" required />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="email">Email</label>
              <input type="email" id="email" className={styles.input} placeholder="name@example.com" required />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="password">Password</label>
              <input type="password" id="password" className={styles.input} placeholder="••••••••" required />
            </div>

            <button type="submit" className={styles.submitBtn}>Sign Up</button>
          </form>

          <div className={styles.divider}>or continue with</div>

          <button className={styles.socialBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <p className={styles.footer}>
            Already have an account? 
            <Link href="/login" className={styles.footerLink}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
