import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron-auth';
import { runRetentionPurge } from '@/lib/dpdp';

export async function POST(req: NextRequest) {
  const denied = requireCronSecret(req);
  if (denied) return denied;

  try {
    const result = await runRetentionPurge();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Retention purge failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
