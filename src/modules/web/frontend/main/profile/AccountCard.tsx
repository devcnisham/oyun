'use client';

import Link from 'next/link';
import { useClerk, useUser } from '@clerk/nextjs';
import ProfileIcon from '@/modules/web/frontend/main/profile/ProfileIcon';
import styles from '@/modules/web/frontend/main/profile/Account.module.css';

// Player account (Clerk) on the Profile page: who is signed in, plus Manage account and Sign out
export default function AccountCard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { openUserProfile, signOut } = useClerk();
  if (!isLoaded) return <div className={styles.card} aria-busy="true" style={{ minHeight: 160 }} />;

  if (!isSignedIn) {
    return (
      <section className={`${styles.card} ${styles.signInCard}`}>
        <div className={styles.signInIcon} aria-hidden><ProfileIcon name="user" /></div>
        <h2>Sign in to OYUN</h2>
        <p>Keep your bookings and wallet on every device.</p>
        <div className={styles.authRow}>
          <Link href="/login" className={styles.primaryBtn}>Sign in</Link>
          <Link href="/signup" className={styles.ghostBtn}>Create account</Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <div className={styles.who}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Clerk serves the sized photo */}
        <img src={user.imageUrl} alt="" width={56} height={56} className={styles.photo} />
        <div className={styles.whoText}>
          <b>{user.fullName || user.username || 'Signed in'}</b>
          <span>{user.primaryEmailAddress?.emailAddress ?? user.primaryPhoneNumber?.phoneNumber ?? ''}</span>
        </div>
      </div>
      <div className={styles.cardActions}>
        <button type="button" className={styles.ghostBtn} onClick={() => openUserProfile()}>
          <ProfileIcon name="user" />Manage account
        </button>
        <button type="button" className={styles.ghostBtn} onClick={() => signOut({ redirectUrl: '/' })}>
          <ProfileIcon name="logout" />Sign out
        </button>
      </div>
    </section>
  );
}
