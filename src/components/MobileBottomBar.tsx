'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './MobileBottomBar.module.css';

const TABS = [
  { label: 'Home', href: '/', icon: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' },
  { label: 'Explore', href: '/arenas', icon: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4.35-4.35' },
  { label: 'Bookings', href: '/bookings', icon: 'M4 6h16v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm0 4h16M8 3v4m8-4v4' },
  { label: 'Profile', href: '/profile', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0' },
];

// App-style tab bar on phones; hidden on desktop
export default function MobileBottomBar() {
  const pathname = usePathname() ?? '/';

  // Turf pages use the bottom of the screen for the booking bar
  if (pathname.startsWith('/arenas/') || pathname.endsWith('/invoice')) return null;

  return (
    <nav className={styles.bottomBar} aria-label="Main">
      {TABS.map((tab) => {
        const active = tab.href === '/' ? pathname === '/' : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link key={tab.href} href={tab.href} className={`${styles.navItem} ${active ? styles.active : ''}`} aria-current={active ? 'page' : undefined}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={tab.icon} />
            </svg>
            <span className={styles.label}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
