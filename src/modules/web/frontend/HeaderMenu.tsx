'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import styles from './HeaderMenu.module.css';

const accountLinks = [
  { href: '/bookings', label: 'Your bookings', detail: 'Upcoming games and past bookings', icon: 'M4 5h16v16H4zM8 3v4m8-4v4M4 11h16' },
  { href: '/saved', label: 'Saved venues', detail: 'Your favourite places to play', icon: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z' },
  { href: '/profile', label: 'Your account', detail: 'Manage your player profile', icon: 'M20 21v-2a7 7 0 0 0-14 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z' },
  { href: '/settings', label: 'Settings', detail: 'Manage your preferences', icon: 'M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6' },
  { href: '/help', label: 'Help & support', detail: 'Booking questions and contact details', icon: 'M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4ZM8 10h8m-8 4h5' },
];
const exploreLinks = [['/arenas', 'Browse venues'], ['/tournaments', 'Tournaments'], ['/news', 'News & events'], ['/blog', 'Blog'], ['/about', 'About us']];

export default function HeaderMenu({ signedIn = false, firstName = '' }: { signedIn?: boolean; firstName?: string }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const triggerElement = trigger.current;
    element?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = previousOverflow; triggerElement?.focus(); };
  }, [open]);
  return <>
    <button type="button" className={styles.trigger} ref={trigger} aria-label="Open menu" aria-expanded={open} aria-controls="header-menu" onClick={() => setOpen(true)}>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
    </button>
    {open && createPortal(<dialog ref={dialog} id="header-menu" className={styles.drawer} aria-labelledby="menu-title" onClose={() => setOpen(false)} onCancel={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setOpen(false); } }}>
      <div className={styles.top}><h2 id="menu-title">{signedIn ? `Hey, ${firstName || 'player'}!` : 'Hey!'}</h2><button type="button" className={styles.close} aria-label="Close menu" onClick={() => setOpen(false)}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg></button></div>
      <div className={styles.account}><div className={styles.accountIcon} aria-hidden="true">OYUN</div><p>{signedIn ? 'Ready for your next game?' : 'Your games. Your favourite places.'}</p><Link href={signedIn ? '/profile' : '/login'} onClick={() => setOpen(false)}>{signedIn ? 'Your profile' : 'Sign in / Register'}</Link></div>
      <nav aria-label="Your OYUN account">{accountLinks.map(item => <Link key={item.href} href={item.href} className={styles.row} onClick={() => setOpen(false)}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={item.icon} /></svg><span><strong>{item.label}</strong><small>{item.detail}</small></span></Link>)}</nav>
      <nav className={styles.explore} aria-label="Explore OYUN"><p>EXPLORE OYUN</p>{exploreLinks.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}</nav>
      <p className={styles.tagline}>OYUN · PLAY BEYOND.</p>
    </dialog>, document.body)}
  </>;
}
