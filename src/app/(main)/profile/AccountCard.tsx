'use client';

import Link from 'next/link';
import { useClerk, useUser } from '@clerk/nextjs';
import styles from './Account.module.css';

// Player account (Clerk) on the Profile tab: who is signed in, plus Manage account and Sign out
export default function AccountCard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { openUserProfile, signOut } = useClerk();
  if (!isLoaded) return <div className={styles.card} aria-busy="true" style={{ minHeight: 92 }} />;

  if (!isSignedIn) {
    return (
      <div className={styles.card}>
        <h2>Sign in to OYUN</h2>
        <p className={styles.hint}>Keep your bookings and wallet on every device.</p>
        <div className={styles.authRow}>
          <Link href="/login" className={styles.primaryBtn}>Sign in</Link>
          <Link href="/signup" className={styles.ghostBtn}>Create account</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`${styles.card} ${styles.who}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Clerk serves the sized photo */}
        <img src={user.imageUrl} alt="" width={52} height={52} className={styles.photo} />
        <div className={styles.whoText}>
          <b>{user.fullName || user.username || 'Signed in'}</b>
          <span>{user.primaryEmailAddress?.emailAddress ?? user.primaryPhoneNumber?.phoneNumber ?? ''}</span>
        </div>
      </div>
      <nav className={styles.menu} aria-label="Your account">
        <button type="button" onClick={() => openUserProfile()}><span aria-hidden>👤</span>Manage account<i aria-hidden>›</i></button>
        <button type="button" onClick={() => signOut({ redirectUrl: '/' })}><span aria-hidden>↪️</span>Sign out<i aria-hidden>›</i></button>
      </nav>
    </>
  );
}
