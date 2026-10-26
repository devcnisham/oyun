'use client';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getBookingSummaries } from '@/modules/web/backend/booking-actions';
import { DEVICE_EVENT, getMyBookingIds, getProfile } from '@/modules/web/frontend/hooks/device';
import { clerkEnabled } from '@/modules/shared/lib/clerk';
import styles from '@/modules/web/frontend/main/_booking/HomeNav.module.css';

const ClerkAccount = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? dynamic(() => import('@/modules/web/frontend/ClerkAccount')) : null;

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '/m';
  const [firstName, setFirstName] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [upcoming, setUpcoming] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      const profile = getProfile();
      setFirstName(profile.name.trim().split(/\s+/)[0] ?? '');
      setSignedIn(Boolean(profile.name.trim() || profile.phone));
      const ids = getMyBookingIds();
      if (!ids.length && !clerkEnabled) return setUpcoming(0);
      const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
      getBookingSummaries(ids).then(list => {
        if (!cancelled) setUpcoming(list.filter(b => b.status === 'confirmed' && b.date >= today).length);
      }).catch(() => {});
    };
    queueMicrotask(refresh);
    window.addEventListener(DEVICE_EVENT, refresh);
    return () => { cancelled = true; window.removeEventListener(DEVICE_EVENT, refresh); };
  }, []);

  return (
    <div className={`${styles.navSlot} ${!isHome ? styles.innerSlot : ''}`}>
      <nav className={styles.nav} data-app-header={isHome ? undefined : true} data-main-navigation aria-label="Main navigation">
        <div className={styles.inner}>
          <Link href="/" className={styles.brand} aria-label="OYUN home"><Image src="/oyun-icon.svg" alt="" width={36} height={36} />OYUN</Link>
          <div className={styles.actions}>
            <Link href="/bookings" className={styles.primaryAction}>Bookings{upcoming > 0 ? ` (${upcoming})` : ''}</Link>
            {clerkEnabled && ClerkAccount ? <ClerkAccount className={styles.account} /> : <Link href={signedIn ? '/profile' : '/login'} className={styles.account}>{signedIn ? `Hi, ${firstName || 'player'}` : 'Sign in'}</Link>}
          </div>
        </div>
      </nav>
    </div>
  );
}
