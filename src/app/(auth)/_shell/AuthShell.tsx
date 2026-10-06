import Image from 'next/image';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import styles from '../auth.module.css';

// Shared frame for /login and /signup: photo panel on desktop, form on the right
export default function AuthShell({ title, subtitle, tagline, children, footer }: {
  title: string;
  subtitle: string;
  tagline: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      <div className={styles.imagePanel}>
        <Image
          src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2000&auto=format&fit=crop"
          alt="Football on a turf pitch"
          fill
          sizes="50vw"
          className={styles.image}
        />
        <div className={styles.imageOverlay}>
          <p className={styles.brandTagline}>{tagline}</p>
        </div>
      </div>

      <div className={styles.formPanel}>
        <BackButton className={styles.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
          Back
        </BackButton>

        <div className={styles.formWrapper}>
          <div className={styles.header}>
            <Link href="/" className={styles.brandLogo} aria-label="OYUN home">
              <span className={styles.logoMark} aria-hidden>O</span>
              <span className={styles.logoName}>OYUN</span>
            </Link>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>

          <div className={styles.clerkSlot}>{children}</div>

          <div className={styles.footer}>{footer}</div>
        </div>
      </div>
    </div>
  );
}
