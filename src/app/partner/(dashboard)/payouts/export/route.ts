import { getPartnerContext } from '@/modules/shared/backend/partner-auth';
import { gstSplit } from '@/modules/shared/lib/pricing';
import { bookingRevenue, onlineCollected } from '@/modules/shared/lib/reports';
import { getDb } from '@/modules/shared/database/store';
import { addDays, istNow } from '@/modules/shared/lib/time';

const csvCell = (v: string | number) => {
  const s = String(v);
  // Quote values and neutralise spreadsheet formulas
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET() {
  const ctx = await getPartnerContext();
  if (!ctx || !ctx.can('payouts')) return new Response('Unauthorized', { status: 401 });

  const db = await getDb();
  const today = istNow().date;
  const from = addDays(today, -90);
  const rows = db.bookings
    .filter((b) => b.turfId === ctx.turf.id && b.date >= from && b.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);

  const header = ['Date', 'Slot', 'Invoice', 'Player', 'Phone', 'Source', 'Payment', 'Status', 'Booking total', 'Revenue', 'Collected online', 'Taxable value', 'GST'];
  const lines = rows.map((b) => {
    const revenue = bookingRevenue(b);
    const gst = gstSplit(revenue, db.settings.gstPercent);
    return [b.date, b.timeLabel, `INV-${b.code.slice(3)}`, b.customerName, b.customerPhone, b.source, b.paymentMode, b.status, b.pricing.total, revenue, onlineCollected(b), gst.taxable, gst.tax]
      .map(csvCell)
      .join(',');
  });

  return new Response([header.map(csvCell).join(','), ...lines].join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${ctx.turf.id}-bookings-${from}-to-${today}.csv"`,
    },
  });
}
