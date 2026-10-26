'use client';

import { useUser } from '@clerk/nextjs';
import styles from '@/modules/web/frontend/BottomNav.module.css';

const PLAIN = (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden>
    <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9c0-4 3.6-7 8-7s8 3 8 7H4Z" />
  </svg>
);

// Signed in with Clerk: the player's photo
export default function ClerkProfileIcon() {
  const { isSignedIn, user } = useUser();
  if (!isSignedIn) return PLAIN;
  // eslint-disable-next-line @next/next/no-img-element -- Clerk serves the sized photo
  return <img src={user.imageUrl} alt="" width={26} height={26} className={styles.avatar} />;
}
