import { getPartnerContext } from '@/modules/shared/backend/partner-auth';
import { generatePayoutStatementHtml } from '@/modules/shared/lib/payouts';
import { bookingsByIds, getDb } from '@/modules/shared/database/store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getPartnerContext();
  if (!ctx || !ctx.can('payouts')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const db = await getDb();
  const payout = (db.payouts ?? []).find((p) => p.id === id);
  if (!payout) {
    return new Response('Payout not found', { status: 404 });
  }

  // Ensure this partner owns this payout
  if (payout.partnerId !== ctx.partner.id) {
    return new Response('Forbidden', { status: 403 });
  }

  const bookings = await bookingsByIds(db, payout.bookingIds);
  const html = generatePayoutStatementHtml(payout, ctx.partner, ctx.turf, bookings, db.settings.gstPercent);

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="settlement-statement-${id}.html"`,
    },
  });
}
