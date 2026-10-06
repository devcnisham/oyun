import Image from 'next/image';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import styles from '../auth.module.css';

function Logo({ id, size = 36 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="20" cy="20" r="18" fill={`url(#${id})`} />
      <path d="M 12 12 L 18 22 L 27 16 L 31 19" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="32" cy="12" r="2.5" fill="white" />
      <path d="M 14 28 Q 22 32 30 24" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <defs>
        <linearGradient id={id} x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d31027" />
          <stop offset="1" stopColor="#4A0000" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const perks = [
  { icon: '⚡', title: 'Instant confirmation', text: 'Pick your hours and they are yours in seconds.' },
  { icon: '🎟️', title: 'QR tickets', text: 'Show your ticket at the turf and walk in.' },
  { icon: '💰', title: 'Cashback on every game', text: 'Rewards go straight to your wallet.' },
];

// Shared frame for /login and /signup: brand panel on desktop, a clean form card everywhere
export default function AuthShell({ mode, title, subtitle, children, footer }: {
  mode: 'login' | 'signup';
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      <aside className={styles.brandPanel}>
        <Image
          src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1600&auto=format&fit=crop"
          alt=""
          fill
          sizes="50vw"
          className={styles.brandImage}
          priority
        />
        <div className={styles.brandInner}>
          <Link href="/" className={styles.brandHome} aria-label="OYUN home">
            <Logo id="authLogoBrand" size={44} />
            <span>OYUN</span>
          </Link>
          <div>
            <p className={styles.brandHeadline}>Book Mangalore&apos;s best turfs in seconds.</p>
            <ul className={styles.perks}>
              {perks.map((p) => (
                <li key={p.title}>
                  <span aria-hidden>{p.icon}</span>
                  <div><b>{p.title}</b><small>{p.text}</small></div>
                </li>
              ))}
            </ul>
          </div>
          <p className={styles.brandFoot}>Football · Box Cricket · Badminton · Padel</p>
        </div>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.topBar}>
          <BackButton className={styles.backBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
            Back
          </BackButton>
          <Link href="/" className={styles.mobileLogo} aria-label="OYUN home">
            <Logo id="authLogoMobile" size={30} />
            <span>OYUN</span>
          </Link>
        </div>

        <div className={styles.formWrapper}>
          <nav className={styles.tabs} aria-label="Account">
            <Link href="/login" className={mode === 'login' ? styles.tabOn : ''} aria-current={mode === 'login' ? 'page' : undefined}>Sign in</Link>
            <Link href="/signup" className={mode === 'signup' ? styles.tabOn : ''} aria-current={mode === 'signup' ? 'page' : undefined}>Create account</Link>
          </nav>

          <header className={styles.header}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </header>

          {children}

          {footer && <div className={styles.footer}>{footer}</div>}
        </div>

        <p className={styles.legal}>
          By continuing you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </main>
    </div>
  );
}
