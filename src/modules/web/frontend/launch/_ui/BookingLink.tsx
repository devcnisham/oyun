'use client';

import Link from 'next/link';
import { useRef, useSyncExternalStore, type ReactNode } from 'react';
import styles from './BookingLink.module.css';

const subscribe = () => () => {};
const localHref = () => ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname) ? '/booking' : 'https://book.oyun.co.in';
const serverHref = () => 'https://book.oyun.co.in';

export default function BookingLink({ children, className }: { children: ReactNode; className?: string }) {
  const href = useSyncExternalStore(subscribe, localHref, serverHref);
  const dialog = useRef<HTMLDialogElement>(null);
  const loginHref = href.startsWith('/') ? '/login?redirect_url=%2Fbooking' : 'https://book.oyun.co.in/login?redirect_url=%2F';
  return <>
    <Link href={href} className={className} onClick={event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      dialog.current?.showModal();
    }}>{children}</Link>
    <dialog ref={dialog} className={styles.dialog} aria-label="Welcome to OYUN" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className={styles.content}>
        <button type="button" className={styles.close} aria-label="Close" onClick={() => dialog.current?.close()}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="m6 6 12 12M18 6 6 18" /></svg></button>
        <span className={styles.brand}>OYUN</span>
        <h2>Ready for your next game?</h2>
        <p>Sign in to manage your bookings and save your favourite venues.</p>
        <Link href={loginHref} className={styles.signin}>Sign in / Register</Link>
        <Link href={href} className={styles.skip} onClick={() => dialog.current?.close()}>Skip for now</Link>
      </div>
    </dialog>
  </>;
}
