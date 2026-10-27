'use client';

import { usePathname, useRouter } from 'next/navigation';
import BackButton from '@/modules/web/frontend/BackButton';
import FloatingSearch from '@/modules/web/frontend/FloatingSearch';
import styles from '@/modules/web/frontend/AppBar.module.css';

const TITLES: [string, string][] = [
  ['/arenas', 'Venues'],
  ['/bookings', 'Bookings'],
  ['/profile', 'Profile'],
  ['/saved', 'Saved'],
  ['/settings', 'Settings'],
  ['/help', 'Help'],
  ['/faq', 'FAQ'],
  ['/matches', 'Play together'],
  ['/tournaments', 'Tournaments'],
  ['/sports', 'Sports'],
  ['/offers', 'Offers'],
  ['/events', 'Events'],
  ['/guides', 'Guides'],
  ['/membership', 'Account'],
  ['/list-turf', 'List your venue'],
  ['/turfs', 'Venues'],
  ['/courts', 'Courts'],
  ['/curated', 'Collections'],
];

// Phone-only top bar for inner pages: back, page title, search. Replaces the website header on phones.
export default function AppBar() {
  const path = usePathname() ?? '/';
  const router = useRouter();
  // Home draws its own header; the venue page has its own floating controls
  if (path === '/' || path === '/m' || ['/blog', '/news', '/events', '/about'].includes(path) || (path.startsWith('/arenas/') && path !== '/arenas')) return null;
  const title = TITLES.find(([p]) => path === p || path.startsWith(`${p}/`))?.[1] ?? 'OYUN';
  // Top-level tabs have nothing to go back to
  const isTab = ['/arenas', '/bookings', '/profile'].includes(path);
  return (
    <div className={styles.bar} data-app-bar>
      {isTab ? (
        <span className={styles.gap} aria-hidden />
      ) : (
        <BackButton className={styles.back} ariaLabel="Back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
        </BackButton>
      )}
      <p className={styles.title}>{title}</p>
      <div className={styles.tools}>
        <FloatingSearch className={styles.search} />
        {path === '/arenas' && <button type="button" className={styles.search} aria-label="Show venue map" title="Map" onClick={() => { const params = new URLSearchParams(window.location.search); params.set('view', 'map'); router.push(`/arenas?${params}`); }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2V5Z" /><path d="M9 3v15M15 6v15" /></svg></button>}
      </div>
    </div>
  );
}
