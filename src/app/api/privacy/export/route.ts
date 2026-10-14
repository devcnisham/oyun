import { NextResponse } from 'next/server';
import { currentAccountId } from '@/lib/current-account';
import { exportUserData } from '@/lib/dpdp';
import { sharedRateLimit } from '@/lib/shared-rate-limit';

// Returns the signed-in player's own data. The account comes from the Clerk session, never from the request:
// a phone number in the URL would let anyone download another person's bookings and wallet.
export async function GET() {
  const accountId = await currentAccountId();
  if (!accountId) {
    return NextResponse.json({ error: 'Sign in to download your data.' }, { status: 401 });
  }
  if (!(await sharedRateLimit(`dpdp-export:${accountId}`, 10, 60_000))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const data = await exportUserData(accountId);
  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="oyun-data-export.json"',
      'Cache-Control': 'no-store',
    },
  });
}
