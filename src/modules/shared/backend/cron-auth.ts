import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

// Guard for routes a scheduler calls (payout settlement, retention purge).
// Fails closed: with no CRON_SECRET configured nobody can call them, so a missing
// environment variable can never leave a money-moving route open to the internet.
// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically once the variable is set.
export function requireCronSecret(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Cron is not configured' }, { status: 503 });
  }
  const given = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
