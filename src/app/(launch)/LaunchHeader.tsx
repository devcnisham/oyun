'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './LaunchHeader.module.css';

// Header bar shared by the pre-launch pages: same brand-gradient bar as the site navbar
export default function LaunchHeader({ current }: { current?: 'about' }) {
  const [hidden, setHidden] = useState(false);

  // Slides away while reading down the page, comes back on any scroll up (same as the site navbar)
  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        // Any scroll up brings the bar straight back; it hides only while reading down
        if (y < 10 || y < lastY) setHidden(false);
        else if (y > lastY) setHidden(true);
        lastY = y;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
    <div className={styles.spacer} aria-hidden="true" />
    <header className={`${styles.header} ${hidden ? styles.hidden : ''}`}>
      <div className={styles.inner}>
        <Link href="/welcome" className={styles.brandLink}>
          <svg className={styles.logoSvg} width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="20" cy="20" r="18" fill="url(#oyunGradHead)" />
            <path d="M 12 12 L 18 22 L 27 16 L 31 19" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="32" cy="12" r="2.5" fill="white" />
            <path d="M 14 28 Q 22 32 30 24" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M 10 23 Q 16 26 22 21" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <defs>
              <linearGradient id="oyunGradHead" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9E0A0A" />
                <stop offset="1" stopColor="#4A0000" />
              </linearGradient>
            </defs>
          </svg>
          <span>
            <span className={styles.brandName}>OYUN</span>
            <small className={styles.brandTag}>Discover · Book · Play</small>
          </span>
        </Link>
        <nav className={styles.nav} aria-label="Page">
          <Link
            href="/about"
            className={`${styles.navLink} ${current === 'about' ? styles.navLinkOn : ''}`}
            aria-current={current === 'about' ? 'page' : undefined}
          >
            About us
          </Link>
          <span className={styles.soonBtn}>Launching soon</span>
        </nav>
      </div>
    </header>
    </>
  );
}
