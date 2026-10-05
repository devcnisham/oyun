'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isArenaDetail = pathname?.startsWith('/arenas/') && pathname !== '/arenas';
  
  const [scrolled, setScrolled] = useState(false);
  const [overscrolled, setOverscrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setOverscrolled(window.scrollY < 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`${isHome ? styles.transparentWrapper : styles.stickyWrapper} ${isArenaDetail ? styles.desktopOnlyNav : ''}`}>
      <header className={`${styles.navbar} ${isHome && !scrolled && !overscrolled ? styles.navbarTransparent : ''}`}>
        <div className={`container ${styles.inner}`}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 6px 12px rgba(100, 0, 0, 0.4)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' }}>
              <circle cx="20" cy="20" r="18" fill="url(#shieldGrad)"/>
              <path d="M 12 12 L 18 22 L 27 16 L 31 19" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="32" cy="12" r="2.5" fill="white"/>
              <path d="M 14 28 Q 22 32 30 24" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M 10 23 Q 16 26 22 21" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <defs>
                <linearGradient id="shieldGrad" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#9E0A0A"/>
                  <stop offset="1" stopColor="#4A0000"/>
                </linearGradient>
              </defs>
            </svg>
            <span className={styles.logoName}>OYUN</span>
          </Link>

          {/* Nav Links */}
          <nav className={`${styles.navLinks} ${menuOpen ? styles.navOpen : ''}`}>
            <Link href="/list-turf" style={{textDecoration: 'none'}}>
              <div className={styles.navItem}>
                <span className={styles.navIcon}>💼</span>
                <div className={styles.navText}>
                  <span className={styles.navTitle}>List your property</span>
                  <span className={styles.navSub}>Start earning today</span>
                </div>
              </div>
            </Link>
            <Link href="/login" style={{textDecoration: 'none'}}>
              <div className={styles.navItem}>
                <span className={styles.navIcon}>👤</span>
                <div className={styles.navText}>
                  <span className={styles.navTitle}>Login / Signup</span>
                </div>
              </div>
            </Link>
          </nav>

          {/* Hamburger */}
          <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
            <span className={`${styles.bar} ${menuOpen ? styles.barOpen1 : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.barOpen2 : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.barOpen3 : ''}`} />
          </button>
        </div>
      </header>
    </div>
  );
}
