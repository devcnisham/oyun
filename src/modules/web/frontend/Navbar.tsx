'use client';

import Image from 'next/image';
import HeaderMenu from './HeaderMenu';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { DEVICE_EVENT, getProfile } from '@/modules/web/frontend/hooks/device';
import { clerkEnabled } from '@/modules/shared/lib/clerk';
import styles from '@/modules/web/frontend/main/_booking/HomeNav.module.css';

const ClerkAccount = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? dynamic(() => import('@/modules/web/frontend/ClerkAccount')) : null;

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname?.startsWith('/arenas/') || pathname === '/' || pathname === '/m' || ['/blog', '/news', '/events', '/about'].includes(pathname ?? '');
  const [firstName, setFirstName] = useState('');
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const profile = getProfile();
      setFirstName(profile.name.trim().split(/\s+/)[0] ?? '');
      setSignedIn(Boolean(profile.name.trim() || profile.phone));

    };
    queueMicrotask(refresh);
    window.addEventListener(DEVICE_EVENT, refresh);
    return () => window.removeEventListener(DEVICE_EVENT, refresh);
  }, []);

  return (
    <div className={`${styles.navSlot} ${!isHome ? styles.innerSlot : ''}`}>
      <nav className={styles.nav} data-app-header={isHome ? undefined : true} data-main-navigation aria-label="Main navigation">
        <div className={styles.inner}>
          <div className={styles.identity}><Link href="/" className={styles.brand} aria-label="OYUN home"><Image src="/oyun-icon.svg" alt="" width={36} height={36} />OYUN</Link></div>
          <div className={styles.links}>
            <Link href="/blog" aria-current={pathname === '/blog' ? 'page' : undefined}>Blog</Link>
            <Link href="/news" aria-current={pathname === '/news' || pathname === '/events' ? 'page' : undefined}>News &amp; Events</Link>
            <Link href="/about" aria-current={pathname === '/about' ? 'page' : undefined}>About us</Link>
          </div>
          <div className={styles.actions}>
            {clerkEnabled && ClerkAccount ? <ClerkAccount className={styles.account} /> : <Link href={signedIn ? '/profile' : '/login'} className={styles.account}>{signedIn ? `Hi, ${firstName || 'player'}` : 'Sign in'}</Link>}
            <HeaderMenu signedIn={signedIn} firstName={firstName} />
          </div>
        </div>
      </nav>
    </div>
  );
}
