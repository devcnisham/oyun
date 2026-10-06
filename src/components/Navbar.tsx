'use client';

import Link from 'next/link';
import { useCallback, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getBookingSummaries } from '@/lib/booking-actions';
import { DEVICE_EVENT, getMyBookingIds, getPreferredArea, getProfile, setPreferredArea } from '@/lib/client/device';
import { clerkEnabled } from '@/lib/clerk';
import ClerkAccount from './ClerkAccount';
import SideMenu from './SideMenu';
import styles from './Navbar.module.css';

export default function Navbar({ areas = [] }: { areas?: string[] }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isArenaDetail = pathname?.startsWith('/arenas/') && pathname !== '/arenas';
  
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [area, setArea] = useState('');
  const [areaSheet, setAreaSheet] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const [upcoming, setUpcoming] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [overscrolled, setOverscrolled] = useState(false);
  
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const handleScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        setScrolled(y > 20);
        setOverscrolled(y < 0);
        // Slide the header away while reading down the page; bring it back on any scroll back up
        if (y < 80) setHidden(false);
        else if (y > lastY + 6) setHidden(true);
        else if (y < lastY - 6) setHidden(false);
        if (Math.abs(y - lastY) > 6) lastY = y;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Never hide while a menu or sheet from the header is open
  const headerHidden = hidden && !menuOpen && !areaSheet;

  // Name and upcoming-booking count come from what this device has saved
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      const profile = getProfile();
      setFirstName(profile.name.trim().split(/\s+/)[0] ?? '');
      setSignedIn(Boolean(profile.name.trim() || profile.phone));
      const ids = getMyBookingIds();
      if (ids.length === 0) return setUpcoming(0);
      const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
      getBookingSummaries(ids)
        .then((list) => !cancelled && setUpcoming(list.filter((b) => b.status === 'confirmed' && b.date >= today).length))
        .catch(() => {});
    };
    queueMicrotask(() => {
      refresh();
      setArea(getPreferredArea());
    });
    window.addEventListener(DEVICE_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(DEVICE_EVENT, refresh);
    };
  }, []);

  return (
    <>
    <div className={`${isHome ? styles.transparentWrapper : styles.stickyWrapper} ${isArenaDetail ? styles.desktopOnlyNav : ''} ${headerHidden ? styles.headerHidden : ''}`}>
      <header className={`${styles.navbar} ${isHome && !scrolled && !overscrolled ? styles.navbarTransparent : ''}`}>
        <div className={`container ${styles.inner}`}>
          <div className={styles.left}>
          <button type="button" className={styles.menuBtn} onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
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
          </div>

          <div className={styles.right}>
            {/* Desktop only: partner call to action */}
            <Link href="/list-turf" className={`${styles.navItem} ${styles.desktopOnly}`}>
              <span className={styles.navIcon} aria-hidden>💼</span>
              <span className={styles.navText}>
                <span className={styles.navTitle}>List your turf</span>
                <span className={styles.navSub}>Start earning today</span>
              </span>
            </Link>

            {/* Account: Clerk sign-in when configured, otherwise the name saved on this device */}
            {clerkEnabled ? (
              <ClerkAccount className={styles.account} nameClassName={styles.accountName} />
            ) : (
            <Link href={signedIn ? '/profile' : '/login'} className={styles.account} aria-label={signedIn ? `Account${firstName ? ` of ${firstName}` : ''}` : 'Sign in'}>
              <span className={styles.accountName}>{signedIn ? `Hi, ${firstName || 'player'}` : 'Sign in'} <span aria-hidden>›</span></span>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            </Link>
            )}

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

      <div className={`${styles.locationStrip} ${isArenaDetail ? styles.desktopOnlyNav : ''}`}>
        <button type="button" className={styles.location} onClick={() => setAreaSheet(true)} aria-haspopup="dialog">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </svg>
          <span>Playing in {area ? `${area}, Mangalore` : 'Mangalore'}</span>
          <span aria-hidden className={styles.chevron}>⌄</span>
        </button>
        <Link href="/list-turf" className={styles.pill}>List your turf</Link>
      </div>

      <SideMenu open={menuOpen} onClose={closeMenu} firstName={firstName} upcoming={upcoming} areas={areas} />

      {areaSheet && (
        <div className={styles.sheetOverlay} onClick={(e) => e.target === e.currentTarget && setAreaSheet(false)}>
          <div className={styles.sheet} role="dialog" aria-modal="true" aria-label="Choose your area">
            <div className={styles.sheetHead}>
              <b>Where do you want to play?</b>
              <button type="button" onClick={() => setAreaSheet(false)}>Close</button>
            </div>
            <button
              type="button"
              className={`${styles.areaOption} ${area === '' ? styles.areaOn : ''}`}
              onClick={() => {
                setPreferredArea('');
                setArea('');
                setAreaSheet(false);
                router.push('/arenas');
              }}
            >
              All of Mangalore
            </button>
            {areas.map((a) => (
              <button
                key={a}
                type="button"
                className={`${styles.areaOption} ${area === a ? styles.areaOn : ''}`}
                onClick={() => {
                  setPreferredArea(a);
                  setArea(a);
                  setAreaSheet(false);
                  router.push(`/arenas?area=${encodeURIComponent(a)}`);
                }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
