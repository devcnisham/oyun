import { NextRequest, NextResponse } from 'next/server';
import { exportUserData, cleanPhone } from '@/lib/dpdp';
import { sharedRateLimit } from '@/lib/shared-rate-limit';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!(await sharedRateLimit(`dpdp-export:${ip}`, 10, 60_000))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const phone = req.nextUrl.searchParams.get('phone');
  if (!phone) {
    return NextResponse.json({ error: 'Phone parameter is required' }, { status: 400 });
  }

  try {
    const cleaned = cleanPhone(phone);
    const data = await exportUserData(cleaned);
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="oyun-data-export-${cleaned}.json"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
