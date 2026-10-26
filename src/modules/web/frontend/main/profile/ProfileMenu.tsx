'use client';

import Link from 'next/link';
import ProfileIcon, { type ProfileIconName } from '@/modules/web/frontend/main/profile/ProfileIcon';
import styles from '@/modules/web/frontend/main/profile/Account.module.css';

export interface MenuItem {
  icon: ProfileIconName;
  label: string;
  note: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
}

// One card of related rows: an icon tile, a label with a short line under it, and an arrow
export default function ProfileMenu({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <section className={styles.group} aria-label={title}>
      <h2 className={styles.groupTitle}>{title}</h2>
      <ul className={styles.rows}>
        {items.map((item) => {
          const inner = (
            <>
              <span className={styles.tile}><ProfileIcon name={item.icon} /></span>
              <span className={styles.rowText}>
                <b>{item.label}</b>
                <small>{item.note}</small>
              </span>
              <svg className={styles.chev} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 6 6 6-6 6" /></svg>
            </>
          );
          return (
            <li key={item.label}>
              {item.onClick ? (
                <button type="button" className={styles.row} onClick={item.onClick}>{inner}</button>
              ) : item.external ? (
                <a className={styles.row} href={item.href}>{inner}</a>
              ) : (
                <Link className={styles.row} href={item.href ?? '/'}>{inner}</Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
