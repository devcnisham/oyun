import { NextRequest, NextResponse } from 'next/server';
import { currentAccountId } from '@/lib/current-account';
import { deleteUserData } from '@/lib/dpdp';
import { sharedRateLimit } from '@/lib/shared-rate-limit';

// Erases the signed-in player's own data. The account comes from the Clerk session, never from the request body.
export async function POST(req: NextRequest) {
  // Cross-site pages must not be able to trigger an erasure with the visitor's session cookie
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  let originHost: string | null = null;
  try {
    originHost = origin ? new URL(origin).host : null;
  } catch {
    originHost = null;
  }
  if (!originHost || !host || originHost !== host) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const accountId = await currentAccountId();
  if (!accountId) {
    return NextResponse.json({ error: 'Sign in to erase your data.' }, { status: 401 });
  }
  if (!(await sharedRateLimit(`dpdp-delete:${accountId}`, 5, 60_000))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const result = await deleteUserData(accountId);
  return NextResponse.json(result);
}
