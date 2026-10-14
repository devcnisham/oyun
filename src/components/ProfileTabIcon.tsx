'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { clerkEnabled } from '@/lib/clerk';
import { DEVICE_EVENT, getProfile } from '@/lib/client/device';
import styles from './BottomNav.module.css';

const PLAIN = (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden>
    <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9c0-4 3.6-7 8-7s8 3 8 7H4Z" />
  </svg>
);

// Signed in with Clerk: the player's photo. Its own chunk, so builds and deployments without Clerk never ship the Clerk hooks.
// The key is read inline so the bundler drops this branch (and the import) when Clerk is off.
const ClerkIcon = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? dynamic(() => import('./ClerkProfileIcon')) : null;

// Signed in on this device only: the first letter of the saved name
function DeviceIcon() {
  const [initial, setInitial] = useState('');
  useEffect(() => {
    const refresh = () => setInitial(getProfile().name.trim().charAt(0).toUpperCase());
    queueMicrotask(refresh);
    window.addEventListener(DEVICE_EVENT, refresh);
    return () => window.removeEventListener(DEVICE_EVENT, refresh);
  }, []);
  if (!initial) return PLAIN;
  return <span className={`${styles.avatar} ${styles.initial}`} aria-hidden>{initial}</span>;
}

// Profile tab icon: plain person when signed out, the player's own picture once signed in
export default function ProfileTabIcon() {
  return clerkEnabled && ClerkIcon ? <ClerkIcon /> : <DeviceIcon />;
}
