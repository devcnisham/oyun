import { NextRequest, NextResponse } from 'next/server';
import { sharedRateLimit } from '@/lib/shared-rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!(await sharedRateLimit(`dpdp-consent:${ip}`, 30, 60_000))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const consent = body?.consent;
    if (consent !== 'all' && consent !== 'essential') {
      return NextResponse.json({ error: 'Consent must be "all" or "essential"' }, { status: 400 });
    }

    const record = {
      consent,
      recordedAt: new Date().toISOString(),
      userAgent: req.headers.get('user-agent') ?? 'unknown',
    };

    return NextResponse.json({ ok: true, record });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
