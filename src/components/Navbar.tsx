'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getBookingSummaries } from '@/lib/booking-actions';
import { DEVICE_EVENT, getMyBookingIds, getProfile } from '@/lib/client/device';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isArenaDetail = pathname?.startsWith('/arenas/') && pathname !== '/arenas';
  
  const [firstName, setFirstName] = useState('');
  const [upcoming, setUpcoming] = useState(0);
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

  // Name and upcoming-booking count come from what this device has saved
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      setFirstName(getProfile().name.trim().split(/\s+/)[0] ?? '');
      const ids = getMyBookingIds();
      if (ids.length === 0) return setUpcoming(0);
      const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
      getBookingSummaries(ids)
        .then((list) => !cancelled && setUpcoming(list.filter((b) => b.status === 'confirmed' && b.date >= today).length))
        .catch(() => {});
    };
    queueMicrotask(refresh);
    window.addEventListener(DEVICE_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(DEVICE_EVENT, refresh);
    };
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

          <div className={styles.right}>
            {/* Desktop only: partner call to action */}
            <Link href="/list-turf" className={`${styles.navItem} ${styles.desktopOnly}`}>
              <span className={styles.navIcon} aria-hidden>💼</span>
              <span className={styles.navText}>
                <span className={styles.navTitle}>List your turf</span>
                <span className={styles.navSub}>Start earning today</span>
              </span>
            </Link>

            {/* Account: "Hi, Name ›" with a profile icon, like a shopping app */}
            <Link href="/profile" className={styles.account} aria-label={firstName ? `Profile of ${firstName}` : 'Profile'}>
              <span className={styles.accountName}>{firstName ? `Hi, ${firstName}` : 'Sign in'} <span aria-hidden>›</span></span>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            </Link>

            {/* Bookings in place of a cart, with the number of upcoming games */}
            <Link href="/bookings" className={styles.bookings} aria-label={upcoming ? `My bookings, ${upcoming} upcoming` : 'My bookings'}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
                <path d="M14 6v12" strokeDasharray="2 2" />
              </svg>
              {upcoming > 0 && <span className={styles.badge}>{upcoming > 9 ? '9+' : upcoming}</span>}
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
}
