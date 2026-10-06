'use client';

import { useEffect, useState } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import { clerkEnabled } from '@/lib/clerk';
import { DEVICE_EVENT, getProfile } from './device';

export interface Account {
  ready: boolean;
  signedIn: boolean;
  name: string;
  phone: string;
}

function useDeviceAccount(): Account {
  const [account, setAccount] = useState<Account>({ ready: false, signedIn: false, name: '', phone: '' });
  useEffect(() => {
    const read = () => {
      const p = getProfile();
      setAccount({ ready: true, signedIn: Boolean(p.name.trim() && p.phone), name: p.name, phone: p.phone });
    };
    queueMicrotask(read);
    window.addEventListener(DEVICE_EVENT, read);
    return () => window.removeEventListener(DEVICE_EVENT, read);
  }, []);
  return account;
}

function useClerkAccount(): Account {
  const { isLoaded, isSignedIn, user } = useUser();
  return {
    ready: isLoaded,
    signedIn: Boolean(isSignedIn),
    name: user?.fullName ?? '',
    phone: (user?.primaryPhoneNumber?.phoneNumber ?? '').replace(/\D/g, '').slice(-10),
  };
}

// Who is signed in: the Clerk user when Clerk is set up, otherwise the account saved on this device.
// clerkEnabled is fixed at build time, so the same hook runs on every render.
export const useAccount: () => Account = clerkEnabled ? useClerkAccount : useDeviceAccount;

function useClerkOpenSignIn() {
  const clerk = useClerk();
  return () => clerk.openSignIn({ forceRedirectUrl: window.location.href, signUpForceRedirectUrl: window.location.href });
}

// Opens Clerk's sign-in modal (Clerk mode only)
export const useOpenClerkSignIn: () => () => void = clerkEnabled ? useClerkOpenSignIn : () => () => {};
