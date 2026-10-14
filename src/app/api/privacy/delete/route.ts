import { NextRequest, NextResponse } from 'next/server';
import { deleteUserData, cleanPhone } from '@/lib/dpdp';
import { sharedRateLimit } from '@/lib/shared-rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!(await sharedRateLimit(`dpdp-delete:${ip}`, 5, 60_000))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const phone = typeof body?.phone === 'string' ? body.phone : '';
    if (!phone) {
      return NextResponse.json({ error: 'Phone field is required' }, { status: 400 });
    }

    const cleaned = cleanPhone(phone);
    const result = await deleteUserData(cleaned);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
