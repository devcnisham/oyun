import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { clerkEnabled } from '@/modules/shared/lib/clerk';
import { partnerSubjectForEmail } from '@/modules/partner/backend/partner-social';
import { createSession } from '@/modules/shared/backend/session';
import { getDb } from '@/modules/shared/database/store';

// Where Clerk sends a partner after Google or Apple sign-in. If the verified email belongs to a partner an admin has
// approved, the normal partner session starts; otherwise they are told how to apply. Never trusts an unverified email.
export async function GET(req: Request) {
  const go = (path: string) => NextResponse.redirect(new URL(path, req.url));
  if (!clerkEnabled) return go('/partner/login');
  const { userId } = await auth();
  if (!userId) return go('/partner/login');
  const user = await currentUser();
  const primary = user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
  if (!primary || primary.verification?.status !== 'verified') return go('/partner/login/unlinked');

  const subject = partnerSubjectForEmail(await getDb(), primary.emailAddress, process.env.OPS_GOOGLE_EMAILS);
  if (!subject) return go('/partner/login/unlinked');
  await createSession('partner', subject);
  return go('/partner');
}
