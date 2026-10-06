'use client';

import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';
import styles from './Profile.module.css';

// Player account (Clerk) on the Profile tab
export default function AccountCard() {
  const { isLoaded, isSignedIn, user } = useUser();
  if (!isLoaded) return <div className={styles.card} aria-busy="true" style={{ minHeight: 92 }} />;

  if (!isSignedIn) {
    return (
      <div className={styles.card}>
        <h2>Your OYUN account</h2>
        <p className={styles.hint}>Sign in to keep your bookings and wallet on every device.</p>
        <div className={styles.authRow}>
          <Link href="/login" className={styles.save}>Sign in</Link>
          <Link href="/signup" className={styles.secondaryBtn}>Create account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${styles.accountRow}`}>
      <UserButton appearance={{ elements: { avatarBox: { width: 44, height: 44 } } }} />
      <div>
        <b>{user.fullName || user.username || 'Signed in'}</b>
        <span className={styles.hint}>{user.primaryEmailAddress?.emailAddress ?? user.primaryPhoneNumber?.phoneNumber ?? ''}</span>
      </div>
    </div>
  );
}
