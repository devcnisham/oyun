import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { clerkEnabled } from '@/modules/shared/lib/clerk';

// The signed-in Clerk player's user id, or null (signed out, Clerk not configured, or the lookup failed)
export async function currentAccountId(): Promise<string | null> {
  if (!clerkEnabled) return null;
  try {
    return (await auth()).userId ?? null;
  } catch {
    return null;
  }
}
