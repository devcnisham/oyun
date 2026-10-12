import Link from 'next/link';
import ActionForm from '@/components/dash/ActionForm';
import { Badge, PageHeader, Stat, dash, inr, tableScroll } from '@/components/dash/ui';
import { requirePartner } from '@/lib/partner-auth';
import { updateBusiness } from '@/lib/partner-actions';
import { commissionFor, gstSplit } from '@/lib/pricing';
import { bookingRevenue, payoutWeeks } from '@/lib/reports';
import { getDb } from '@/lib/store';
import { formatDate, istNow } from '@/lib/time';

export default async function PayoutsPage() {
  const ctx = await requirePartner('payouts');
  const db = await getDb();
  const now = istNow();
  const weeks = payoutWeeks(db, ctx.turf, now.date, 8);
  const rate = commissionFor(db, ctx.turf);
  const business = ctx.partner.business;

  const month = now.date.slice(0, 7);
  const monthBookings = db.bookings.filter((b) => b.turfId === ctx.turf.id && b.date.startsWith(month) && bookingRevenue(b) > 0);
  const monthRevenue = monthBookings.reduce((s, b) => s + bookingRevenue(b), 0);
  const monthGst = monthBookings.reduce((s, b) => s + gstSplit(bookingRevenue(b), db.settings.gstPercent).tax, 0);
  const paidOut = weeks.filter((w) => w.status === 'paid').reduce((s, w) => s + w.payout, 0);
  const pending = weeks.filter((w) => w.status !== 'paid').reduce((s, w) => s + w.payout, 0);

  const recent = db.bookings
    .filter((b) => b.turfId === ctx.turf.id && bookingRevenue(b) > 0 && b.date <= now.date)
    .sort((a, b) => b.date.localeCompare(a.date) || b.hour - a.hour)
    .slice(0, 25);

  return (
    <div className={dash.page}>
      <PageHeader title="Payouts & GST" desc={`Online payments are settled weekly (Monday–Sunday, paid the following Wednesday). Platform commission: ${rate}%.`}>
        <a href="/partner/payouts/export" className={`${dash.btn} ${dash.btnSecondary}`}>Download CSV</a>
      </PageHeader>

      {!business.gstin && (
        <p className={dash.notice}>Add your GSTIN below to issue GST tax invoices. Until then players get payment receipts.</p>
      )}

      <div className={dash.stats}>
        <Stat label="Revenue this month" value={inr(monthRevenue)} hint={`${monthBookings.length} bookings`} />
        <Stat label="GST in this month's revenue" value={inr(monthGst)} hint={`${db.settings.gstPercent}% included in prices`} />
        <Stat label="Paid out (8 weeks)" value={inr(paidOut)} />
        <Stat label="Pending payout" value={inr(pending)} hint="this week and last" />
      </div>

      <div className={dash.card}>
        <div className={dash.cardHeader}><h2 className={dash.cardTitle}>Weekly settlements</h2></div>
        <div {...tableScroll}>
          <table className={dash.table}>
            <thead>
              <tr>
                <th>Week</th><th className={dash.num}>Bookings</th><th className={dash.num}>Total revenue</th>
                <th className={dash.num}>Collected online</th><th className={dash.num}>Commission</th>
                <th className={dash.num}>GST on commission</th><th className={dash.num}>Payout</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.weekStart}>
                  <td className={dash.strong}>{formatDate(w.weekStart, { day: 'numeric', month: 'short' })} – {formatDate(w.weekEnd, { day: 'numeric', month: 'short' })}</td>
                  <td className={dash.num}>{w.bookings}</td>
                  <td className={dash.num}>{inr(w.gross)}</td>
                  <td className={dash.num}>{inr(w.online)}</td>
                  <td className={dash.num}>−{inr(w.commission)}</td>
                  <td className={dash.num}>−{inr(w.commissionGst)}</td>
                  <td className={`${dash.num} ${dash.strong}`}>{inr(w.payout)}</td>
                  <td><Badge status={w.status === 'paid' ? 'active' : w.status === 'processing' ? 'pending' : 'confirmed'} label={w.status === 'upcoming' ? 'In progress' : w.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={dash.muted} style={{ marginTop: 12 }}>Walk-in cash/UPI payments go straight to you, so they count in revenue but not in payouts.</p>
      </div>

      <div className={dash.grid2}>
        <div className={dash.card}>
          <div className={dash.cardHeader}><h2 className={dash.cardTitle}>Invoices</h2></div>
          <div {...tableScroll}>
            <table className={dash.table}>
              <thead><tr><th>Invoice</th><th>Player</th><th className={dash.num}>Amount</th><th></th></tr></thead>
              <tbody>
                {recent.map((b) => (
                  <tr key={b.id}>
                    <td>INV-{b.code.slice(3)}<div className={dash.muted}>{formatDate(b.date)}</div></td>
                    <td>{b.customerName}</td>
                    <td className={dash.num}>{inr(b.pricing.total)}</td>
                    <td><Link href={`/partner/invoices/${b.id}`} className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={dash.card}>
          <div className={dash.cardHeader}>
            <div>
              <h2 className={dash.cardTitle}>Business details</h2>
              <p className={dash.cardDesc}>Printed on every invoice.</p>
            </div>
          </div>
          <ActionForm action={updateBusiness}>
            <label className={dash.field}>
              <span className={dash.label}>Legal business name</span>
              <input name="legalName" defaultValue={business.legalName} required className={dash.input} />
            </label>
            <label className={dash.field}>
              <span className={dash.label}>GSTIN (optional)</span>
              <input name="gstin" defaultValue={business.gstin} maxLength={15} placeholder="29ABCDE1234F1Z5" className={dash.input} />
            </label>
            <label className={dash.field}>
              <span className={dash.label}>Billing address</span>
              <textarea name="address" defaultValue={business.address} required className={dash.textarea} />
            </label>
            <div className={dash.actions}><button className={dash.btn}>Save details</button></div>
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
