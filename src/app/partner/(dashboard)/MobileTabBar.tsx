'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import NavIcon from '@/modules/shared/frontend/dash/NavIcon';
import styles from './MobileTabBar.module.css';

export interface TabItem {
  href: string;
  label: string;
  icon: string;
}

// App-style bottom tab bar for phones: the most used pages plus "More", which opens a sheet with every page
export default function MobileTabBar({ items, all, extra }: { items: TabItem[]; all: TabItem[]; extra: TabItem[] }) {
  const pathname = usePathname();
  // the sheet is keyed to the page it was opened on, so navigating closes it
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const isActive = (href: string) => (href === '/partner' ? pathname === href : pathname.startsWith(href));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenOn(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {open && <button type="button" className={styles.backdrop} aria-label="Close menu" onClick={() => setOpenOn(null)} />}
      {open && (
        <div className={styles.sheet} role="dialog" aria-label="All pages">
          <div className={styles.grab} aria-hidden />
          <div className={styles.sheetGrid}>
            {all.map((p) => (
              <Link key={p.href} href={p.href} className={`${styles.sheetLink} ${isActive(p.href) ? styles.active : ''}`}>
                <NavIcon name={p.icon} size={22} />
                <span>{p.label}</span>
              </Link>
            ))}
            {extra.map((p) => (
              <Link key={p.href} href={p.href} className={styles.sheetLink}>
                <NavIcon name={p.icon} size={22} />
                <span>{p.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      <nav className={`${styles.bar} noPrint`} aria-label="Main">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={`${styles.tab} ${isActive(item.href) ? styles.active : ''}`} aria-current={isActive(item.href) ? 'page' : undefined}>
            <NavIcon name={item.icon} size={22} />
            <span>{item.label}</span>
          </Link>
        ))}
        <button type="button" className={`${styles.tab} ${open ? styles.active : ''}`} aria-expanded={open} onClick={() => setOpenOn(open ? null : pathname)}>
          <NavIcon name="menu" size={22} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
