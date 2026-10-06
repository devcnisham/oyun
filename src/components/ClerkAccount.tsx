'use client';

import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';

// Header account control when Clerk is on: "Sign in ›" when signed out, name + account menu when signed in
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

  return (
    <span className={className}>
      <Link href="/profile" className={nameClassName} style={{ color: 'inherit', textDecoration: 'none' }}>
        Hi, {user.firstName || user.username || user.primaryEmailAddress?.emailAddress.split('@')[0] || 'player'} <span aria-hidden>›</span>
      </Link>
      <UserButton appearance={{ elements: { avatarBox: { width: 28, height: 28 } } }} />
    </span>
  );
}
