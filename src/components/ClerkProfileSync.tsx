'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { getProfile, saveProfile, signOutDevice } from '@/lib/client/device';

const SYNCED_KEY = 'oyun_clerk_synced';

// Once a player signs in with Clerk, copy their name and number into the details the rest of the site uses
// (top bar, side menu, checkout), so every page greets them by name.
export default function ClerkProfileSync() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    // Signed out of Clerk: forget the copied details too, so the site stops greeting them
    if (!isSignedIn || !user) {
      try {
        if (localStorage.getItem(SYNCED_KEY)) {
          localStorage.removeItem(SYNCED_KEY);
          signOutDevice();
        }
      } catch {}
      return;
    }
    try {
      localStorage.setItem(SYNCED_KEY, '1');
    } catch {}
    const saved = getProfile();
    const email = user.primaryEmailAddress?.emailAddress ?? '';
    const name = (user.fullName || user.firstName || user.username || saved.name || email.split('@')[0] || '').trim();
    const phone = (user.primaryPhoneNumber?.phoneNumber ?? '').replace(/\D/g, '').slice(-10) || saved.phone;
    if (name !== saved.name || phone !== saved.phone) saveProfile({ name, phone });
  }, [isLoaded, isSignedIn, user]);

  return null;
}
