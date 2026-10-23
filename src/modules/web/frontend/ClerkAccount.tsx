'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

// Header account control when Clerk is on: "Sign in ›" when signed out; name + photo linking to Profile when signed in.
// Manage account and Sign out live on the Profile page, not in a pop-up here.
export default function ClerkAccount({ className, nameClassName }: { className?: string; nameClassName?: string }) {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded || !isSignedIn) {
    return (
      <Link href="/login" className={className} aria-label="Sign in">
        <span className={nameClassName}>Sign in <span aria-hidden>›</span></span>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      </Link>
    );
  }

  const name = user.firstName || user.username || user.primaryEmailAddress?.emailAddress.split('@')[0] || 'player';
  return (
    <Link href="/profile" className={className} aria-label={`Account of ${name}`}>
      <span className={nameClassName}>Hi, {name} <span aria-hidden>›</span></span>
      {/* eslint-disable-next-line @next/next/no-img-element -- Clerk serves the sized photo */}
      <img src={user.imageUrl} alt="" width={28} height={28} style={{ borderRadius: '50%', objectFit: 'cover' }} />
    </Link>
  );
}
