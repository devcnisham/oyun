import { NextResponse } from 'next/server';
import { detectDoubleBookings, triggerOnCallPage } from '@/modules/shared/lib/alerts';
import { sharedRateLimit } from '@/modules/shared/backend/shared-rate-limit';
import { getDb } from '@/modules/shared/database/store';
import { clientIpFrom } from '@/modules/shared/backend/client-ip';

export async function GET(req: Request) {
  const ip = clientIpFrom(req.headers);
  if (!(await sharedRateLimit(`monitor:double-bookings:${ip}`, 60, 60_000))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const db = await getDb();
  const result = detectDoubleBookings(db.bookings);

  if (result.count > 0) {
    // SEV-1 breach: Double bookings must read 0 at all times!
    await triggerOnCallPage({
      severity: 'critical',
      title: 'Double Booking Detected in Production',
      summary: `${result.count} double-booking collision(s) detected across turfs. Immediate remediation required.`,
      dedupKey: `double-booking-breach-${result.conflicts[0].turfId}`,
      details: {
        conflictCount: result.count,
        conflicts: result.conflicts,
      },
    });

    return NextResponse.json(
      {
        status: 'critical_alert',
        doubleBookings: result.count,
        // Booking ids and codes stay in the on-call page above: this route is public and an id opens a ticket
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: 'ok',
    doubleBookings: 0,
    timestamp: new Date().toISOString(),
  });
}
