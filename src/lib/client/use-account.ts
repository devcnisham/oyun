'use client';

import { useEffect, useState } from 'react';
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

// Who is signed in: the Clerk user when Clerk is set up, otherwise the account saved on this device.
// The Clerk key is fixed at build time, so the same hook runs on every render.
// The key is read inline (always defined at build, see next.config.ts) so the bundler drops the Clerk hooks when it is empty.
// Loaded with require so the whole Clerk module is dropped from the bundle when the key is empty.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const clerkHooks = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (require('./use-account-clerk') as typeof import('./use-account-clerk')) : null;
export const useAccount: () => Account = clerkHooks ? clerkHooks.useClerkAccount : useDeviceAccount;

// Opens Clerk's sign-in modal (Clerk mode only)
export const useOpenClerkSignIn: () => () => void = clerkHooks ? clerkHooks.useClerkOpenSignIn : () => () => {};
