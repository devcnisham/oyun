'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IconArrow, IconClose, IconMenu } from './icons';
import BrandMark from '@/components/BrandMark';
import { APP_URL } from './links';
import styles from './site.module.css';

const SECTIONS = [
  { href: '/#sports', label: 'Sports' },
  { href: '/#how', label: 'How it works' },
  { href: '/#owners', label: 'For turf owners' },
  { href: '/#faq', label: 'FAQ' },
];

// Header shared by the landing, countdown and about pages. Frosted bar, a menu panel on phones, and the one primary
// action everywhere: Browse & book (app.oyun.co.in).
export default function SiteHeader({ current }: { current?: 'about' | 'countdown' }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Escape closes the phone menu
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={`${styles.header} ${scrolled || open ? styles.solid : ''}`}>
      <a href="#content" className={styles.skip}>Skip to content</a>
      <div className={styles.bar}>
        <Link href="/" className={styles.brand}>
          <BrandMark size={34} />
          <span className={styles.brandName}>OYUN</span>
        </Link>

        <nav className={styles.nav} aria-label="Main">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} className={styles.navLink}>{s.label}</Link>
          ))}
          <Link href="/about" className={styles.navLink} aria-current={current === 'about' ? 'page' : undefined}>About</Link>
        </nav>

        <div className={styles.actions}>
          <Link href="/countdown" className={styles.ghost} aria-current={current === 'countdown' ? 'page' : undefined}>Launch countdown</Link>
          <a href={APP_URL} className={styles.primary}>Browse &amp; book <IconArrow size={16} /></a>
          <button type="button" className={styles.menuBtn} aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen((v) => !v)}>
            {open ? <IconClose /> : <IconMenu />}
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          </button>
        </div>
      </div>

      <div id="site-menu" className={`${styles.panel} ${open ? styles.panelOpen : ''}`} hidden={!open}>
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className={styles.panelLink} onClick={() => setOpen(false)}>{s.label}</Link>
        ))}
        <Link href="/about" className={styles.panelLink} onClick={() => setOpen(false)}>About</Link>
        <Link href="/countdown" className={styles.panelLink} onClick={() => setOpen(false)}>Launch countdown</Link>
        <a href={APP_URL} className={`${styles.primary} ${styles.panelCta}`}>Browse &amp; book <IconArrow size={16} /></a>
      </div>
    </header>
  );
}
