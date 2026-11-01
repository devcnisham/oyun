import HeaderBack from '@/modules/web/frontend/HeaderBack';
import Image from 'next/image';
import Link from 'next/link';
import styles from '@/app/(auth)/auth.module.css';

export default function AuthShell({ mode, title, subtitle, children, footer, redirectTo }: {
  mode: 'login' | 'signup'; title: string; subtitle: string; children: React.ReactNode;
  footer?: React.ReactNode; redirectTo?: string;
}) {
  const query = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? `?redirect_url=${encodeURIComponent(redirectTo)}` : '';
  return <div className={styles.container}>
    <aside className={styles.brandPanel} aria-label="Play beyond">
      <Image src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1600&q=85" alt="" fill sizes="50vw" className={styles.brandImage} />
      <div className={styles.brandInner}><span className={styles.brandFoot}>Mangalore / Sports / Your people</span><div><p className={styles.brandHeadline}>MAKE TIME<br />FOR <em>PLAY.</em></p><p className={styles.brandCopy}>Your next game starts with a place.<br />Find yours with OYUN.</p></div><span className={styles.brandFoot}>Football · Box cricket · Badminton · Pickleball</span></div>
    </aside>
    <main className={styles.formPanel} id="main">
      <div className={styles.topBar}><HeaderBack /><Link href="/help">Need help?</Link></div>
      <div className={styles.formWrapper}>
        <nav className={styles.tabs} aria-label="Account"><Link href={`/login${query}`} className={mode === 'login' ? styles.tabOn : ''} aria-current={mode === 'login' ? 'page' : undefined}>Sign in</Link><Link href={`/signup${query}`} className={mode === 'signup' ? styles.tabOn : ''} aria-current={mode === 'signup' ? 'page' : undefined}>Create account</Link></nav>
        <header className={styles.header}><p className={styles.eyebrow}>{mode === 'login' ? 'Back to your game' : 'Join the game'}</p><h1 className={styles.title}>{title}</h1><p className={styles.subtitle}>{subtitle}</p></header>
        {children}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
      <p className={styles.legal}>By continuing, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
    </main>
  </div>;
}
