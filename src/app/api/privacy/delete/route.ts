import { NextRequest, NextResponse } from 'next/server';
import { currentAccountId } from '@/modules/web/backend/current-account';
import { deleteUserData } from '@/modules/web/backend/dpdp';
import { isSameOrigin } from '@/modules/shared/backend/same-origin';
import { sharedRateLimit } from '@/modules/shared/backend/shared-rate-limit';

// Erases the signed-in player's own data. The account comes from the Clerk session, never from the request body.
export async function POST(req: NextRequest) {
  // Cross-site pages must not be able to trigger an erasure with the visitor's session cookie
  if (!isSameOrigin(req.headers)) {
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
