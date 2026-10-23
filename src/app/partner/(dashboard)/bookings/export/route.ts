import { getPartnerContext } from '@/modules/shared/backend/partner-auth';
import { getDb } from '@/modules/shared/database/store';

export const dynamic = 'force-dynamic';

// A CSV cell: wrapped in quotes, and a leading = + - @ is neutralised so a customer name cannot run as a spreadsheet formula
function cell(v: string | number) {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

// Bookings of the signed-in partner's current turf as a CSV download, newest date first
export async function GET() {
  const ctx = await getPartnerContext();
  if (!ctx || !ctx.can('bookings')) return new Response('Not signed in', { status: 401 });

  const db = await getDb();
  const rows = db.bookings
    .filter((b) => b.turfId === ctx.turf.id)
    .sort((a, b) => (a.date === b.date ? b.hour - a.hour : a.date < b.date ? 1 : -1));

  const header = ['Code', 'Date', 'Time', 'Customer', 'Phone', 'Source', 'Status', 'Payment', 'Paid (INR)', 'Total (INR)'];
  const lines = [header.map(cell).join(',')];
  for (const b of rows) {
    lines.push(
      [b.code, b.date, b.timeLabel, b.customerName, b.customerPhone, b.source === 'walk_in' ? 'Walk-in' : 'Online', b.status, b.paymentMode, b.amountPaid, b.pricing.total]
        .map(cell)
        .join(','),
    );
  }

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bookings-${ctx.turf.id}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
