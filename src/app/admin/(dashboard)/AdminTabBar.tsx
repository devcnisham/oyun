'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import NavIcon from '@/modules/shared/frontend/dash/NavIcon';
import styles from './AdminTabBar.module.css';

export interface AdminPage {
  href: string;
  label: string;
  icon: string;
  tab?: string; // short label when shown in the bottom bar
}

// Phone navigation for admin: four main pages in a bottom bar plus a "More" sheet with every page
export default function AdminTabBar({ pages }: { pages: AdminPage[] }) {
  const pathname = usePathname();
  // the sheet is keyed to the page it was opened on, so navigating closes it without an effect
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => {
    const next = typeof v === 'function' ? v(open) : v;
    setOpenOn(next ? pathname : null);
  };
  const isActive = (href: string) => (href === '/admin' ? pathname === href : pathname.startsWith(href));
  const main = pages.slice(0, 4);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenOn(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {open && <button type="button" className={styles.backdrop} aria-label="Close menu" onClick={() => setOpen(false)} />}
      {open && (
        <div className={styles.sheet} role="dialog" aria-label="All pages">
          <div className={styles.grab} aria-hidden />
          <div className={styles.sheetGrid}>
            {pages.map((p) => (
              <Link key={p.href} href={p.href} className={`${styles.sheetLink} ${isActive(p.href) ? styles.active : ''}`}>
                <NavIcon name={p.icon} size={22} />
                <span>{p.label}</span>
              </Link>
            ))}
            <Link href="/partner" className={styles.sheetLink}>
              <NavIcon name="partners" size={22} />
              <span>Partner dashboard</span>
            </Link>
            <Link href="/" className={styles.sheetLink}>
              <NavIcon name="site" size={22} />
              <span>Main site</span>
            </Link>
          </div>
        </div>
      )}
      <nav className={`${styles.bar} noPrint`} aria-label="Main">
        {main.map((p) => (
          <Link key={p.href} href={p.href} className={`${styles.tab} ${isActive(p.href) ? styles.active : ''}`} aria-current={isActive(p.href) ? 'page' : undefined}>
            <NavIcon name={p.icon} size={22} />
            <span>{p.tab ?? p.label}</span>
          </Link>
        ))}
        <button type="button" className={`${styles.tab} ${open ? styles.active : ''}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <NavIcon name="menu" size={22} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
