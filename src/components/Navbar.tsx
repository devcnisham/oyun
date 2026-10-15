'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getBookingSummaries } from '@/lib/booking-actions';
import { DEVICE_EVENT, getMyBookingIds, getProfile } from '@/lib/client/device';
import { clerkEnabled } from '@/lib/clerk';
import { useTranslation } from '@/lib/client/use-translation';
import dynamic from 'next/dynamic';

// Own chunk: without Clerk keys the branch below is dropped at build time and the Clerk hooks are never shipped
const ClerkAccount = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? dynamic(() => import('./ClerkAccount')) : null;
import styles from './Navbar.module.css';

export default function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [pastHero, setPastHero] = useState(false);
  const isHome = pathname === '/';
  const isArenaDetail = pathname?.startsWith('/arenas/') && pathname !== '/arenas';
  
  const [firstName, setFirstName] = useState('');
  const [signedIn, setSignedIn] = useState(false);
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
        setPastHero(y > 420);
        setOverscrolled(y < 0);
        // Slide the header away while reading down the page; bring it back on any scroll back up
        // Desktop keeps the header pinned; only phones slide it away
        if (y < 80 || window.innerWidth > 768) setHidden(false);
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

  const headerHidden = hidden;
  // Desktop: home shows just the search once the hero is scrolled past; every other page shows just back + search
  const compactBar = !isHome || pastHero;

  // Name and upcoming-booking count come from what this device has saved
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      const profile = getProfile();
      setFirstName(profile.name.trim().split(/\s+/)[0] ?? '');
      setSignedIn(Boolean(profile.name.trim() || profile.phone));
      const ids = getMyBookingIds();
      // Signed-in players also see bookings made on their other devices
      if (ids.length === 0 && !clerkEnabled) return setUpcoming(0);
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
    <>
    <div data-app-header className={`${isHome ? styles.transparentWrapper : styles.stickyWrapper} ${isArenaDetail ? styles.desktopOnlyNav : ''} ${headerHidden ? styles.headerHidden : ''}`}>
      <header className={`${styles.navbar} ${isHome && !scrolled && !overscrolled ? styles.navbarTransparent : ''}`}>
        <div className={`container ${styles.inner} ${compactBar ? styles.searchOnly : ''}`}>
          <div className={styles.left}>
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
            <span className={styles.logoText}>
              <span className={styles.logoName}>OYUN</span>
            </span>
          </Link>
          </div>

          {/* Desktop home: hero search moves up here once it scrolls out of view */}
          {compactBar && (
            <>
            {!isHome && (
              <button type="button" className={styles.navBack} aria-label="Back" onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              </button>
            )}
            <form
              className={styles.navSearch}
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                const term = q.trim();
                router.push(term ? `/arenas?q=${encodeURIComponent(term)}` : '/arenas');
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search turfs or areas" aria-label="Search turfs or areas" />
              <button type="submit">Search</button>
            </form>
            </>
          )}

          <div className={styles.right}>
            {/* Phones: city chip with a live dot, opens every turf */}
            <Link href="/arenas" className={styles.cityChip} aria-label={`Turfs in ${t('nav_mangalore')}`}>
              <span className={styles.liveDot} aria-hidden />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </svg>
              {t('nav_mangalore')}
            </Link>
            {/* Desktop only: partner call to action */}
            <Link href="/list-turf" className={`${styles.navItem} ${styles.desktopOnly}`}>
              <span className={styles.navIcon} aria-hidden>💼</span>
              <span className={styles.navText}>
                <span className={styles.navTitle}>{t('nav_list_turf')}</span>
                <span className={styles.navSub}>{t('nav_start_earning')}</span>
              </span>
            </Link>

            {/* Account: Clerk sign-in when configured, otherwise the name saved on this device */}
            {clerkEnabled && ClerkAccount ? (
              <ClerkAccount className={styles.account} nameClassName={styles.accountName} />
            ) : (
            <Link href={signedIn ? '/profile' : '/login'} className={styles.account} aria-label={signedIn ? `Account${firstName ? ` of ${firstName}` : ''}` : t('nav_sign_in')}>
              <span className={styles.accountName}>{signedIn ? `${t('nav_hi')}, ${firstName || 'player'}` : t('nav_sign_in')} <span aria-hidden>›</span></span>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            </Link>
            )}

            {/* Bookings in place of a cart, with the number of upcoming games */}
            <Link href="/bookings" className={styles.bookings} aria-label={upcoming ? `${t('nav_my_bookings')}, ${upcoming} upcoming` : t('nav_my_bookings')}>
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

    </>
  );
}
