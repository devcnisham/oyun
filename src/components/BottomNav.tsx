'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { LAUNCH_AT, roleForHost } from '@/lib/hosts';
import ProfileTabIcon from './ProfileTabIcon';
import styles from './BottomNav.module.css';

const ICONS = {
  home: <path d="M12 3 3 10.5V21h6.5v-6h5v6H21V10.5L12 3Z" />,
  turfs: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M12 5v14M2.5 9.5H5v5H2.5M21.5 9.5H19v5h2.5" fill="none" stroke="var(--nav-bg)" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="2.2" fill="none" stroke="var(--nav-bg)" strokeWidth="1.4" />
    </>
  ),
  bookings: <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5V7Zm9 1.6-1.1 2.3-2.5.3 1.85 1.75-.48 2.5L12 14.2l2.23 1.25-.48-2.5 1.85-1.75-2.5-.3L12 8.6Z" fillRule="evenodd" />,
  profile: <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9c0-4 3.6-7 8-7s8 3 8 7H4Z" />,
};

const TABS = [
  { href: '/', label: 'Home', icon: 'home', match: (p: string) => p === '/' },
  { href: '/arenas', label: 'Turfs', icon: 'turfs', match: (p: string) => p.startsWith('/arenas') || p.startsWith('/sports') },
  { href: '/bookings', label: 'Bookings', icon: 'bookings', match: (p: string) => p.startsWith('/bookings') },
  { href: '/profile', label: 'Profile', icon: 'profile', match: (p: string) => ['/profile', '/settings', '/help', '/saved'].some((x) => p.startsWith(x)) },
] as const;

const subscribeNever = () => () => {};

// App-style tab bar on phones, on every player-facing page. The admin and partner dashboards have their own menus.
export default function BottomNav() {
  // The phone home page is prebuilt at /m while the address bar says /
  const raw = usePathname() ?? '/';
  const path = raw === '/m' ? '/' : raw;
  // Before launch the www host shows the landing page at / (the address bar does not change), so the host and the date tell us too.
  // After launch www is the whole booking site and keeps the tab bar.
  const onPreLaunchHome = useSyncExternalStore(subscribeNever, () => path === '/' && roleForHost(window.location.host) === 'landing' && Date.now() < LAUNCH_AT, () => false);
  if (onPreLaunchHome || path.startsWith('/admin') || path.startsWith('/partner') || ['/landing', '/countdown', '/about'].includes(path)) return null;

  return (
    <>
    {/* Keeps the end of the page clear of the fixed bar */}
    <div className={styles.spacer} aria-hidden />
    <nav className={styles.nav} aria-label="Main">
      {TABS.map((t) => {
        const active = t.match(path);
        const tab = (
          <Link key={t.href} href={t.href} className={`${styles.tab} ${active ? styles.active : ''}`} aria-current={active ? 'page' : undefined}>
            {t.icon === 'profile' ? <ProfileTabIcon /> : <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden>{ICONS[t.icon]}</svg>}
            <span>{t.label}</span>
          </Link>
        );
        return tab;
      })}
    </nav>
    </>
  );
}
