'use client';

import { useClerk, useUser } from '@clerk/nextjs';
import type { Account } from '@/modules/web/frontend/hooks/use-account';

// Clerk-backed versions of the account hooks. Kept in their own module so use-account.ts only pulls Clerk in when it is configured.
export function useClerkAccount(): Account {
  const { isLoaded, isSignedIn, user } = useUser();
  return {
    ready: isLoaded,
    signedIn: Boolean(isSignedIn),
    name: user?.fullName ?? '',
    phone: (user?.primaryPhoneNumber?.phoneNumber ?? '').replace(/\D/g, '').slice(-10),
  };
}

export function useClerkOpenSignIn() {
  const clerk = useClerk();
  return () => clerk.openSignIn({ forceRedirectUrl: window.location.href, signUpForceRedirectUrl: window.location.href });
}

export function useClerkOpenSignUp() {
  const clerk = useClerk();
  return () => clerk.openSignUp({ forceRedirectUrl: window.location.href, signInForceRedirectUrl: window.location.href });
}
