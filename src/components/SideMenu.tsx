'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './SideMenu.module.css';

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
  firstName: string;
  upcoming: number;
}

// Slide-in menu from the left, opened by the ☰ button in the top bar
export default function SideMenu({ open, onClose, firstName, upcoming }: SideMenuProps) {
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // keep the page from scrolling behind the menu
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <nav className={styles.panel} aria-label="Menu" onClick={(e) => (e.target as HTMLElement).closest('a') && onClose()}>
        <div className={styles.head}>
          <Link href="/profile" className={styles.hello}>
            <span className={styles.avatar} aria-hidden>{firstName ? firstName[0].toUpperCase() : '👤'}</span>
            <span>
              <b>{firstName ? `Hello, ${firstName}` : 'Hello, sign in'}</b>
              <small>Your profile and saved details</small>
            </span>
          </Link>
          <button ref={closeBtn} type="button" className={styles.close} onClick={onClose} aria-label="Close menu">✕</button>
        </div>

        <div className={styles.body}>
          <p className={styles.section}>Book</p>
          <Link href="/" className={styles.item}><span aria-hidden>🏠</span>Home</Link>
          <Link href="/arenas" className={styles.item}><span aria-hidden>🏟️</span>All turfs</Link>
          <Link href="/bookings" className={styles.item}>
            <span aria-hidden>🎟️</span>My bookings
            {upcoming > 0 && <em className={styles.count}>{upcoming} upcoming</em>}
          </Link>
          <Link href="/saved" className={styles.item}><span aria-hidden>♡</span>Saved turfs</Link>
          <Link href="/profile" className={styles.item}><span aria-hidden>👤</span>Profile</Link>

          <p className={styles.section}>Turf owners</p>
          <Link href="/list-turf" className={styles.item}><span aria-hidden>💼</span>List your turf</Link>
          <Link href="/partner/login" className={styles.item}><span aria-hidden>🔑</span>Partner login</Link>
        </div>
      </nav>
    </div>
  );
}
