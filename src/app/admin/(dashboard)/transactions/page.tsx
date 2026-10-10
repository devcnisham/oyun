import Link from 'next/link';
import ActionForm from '@/components/dash/ActionForm';
import { Badge, PageHeader, Stat, dash, inr } from '@/components/dash/ui';
import { refundBooking } from '@/lib/admin-actions';
import { bookingRevenue } from '@/lib/reports';
import { getDb } from '@/lib/store';
import { formatDate } from '@/lib/time';
import type { BookingStatus } from '@/lib/types';
import { halfNote } from '@/lib/pricing';

const STATUSES: BookingStatus[] = ['confirmed', 'checked_in', 'no_show', 'cancelled', 'refunded'];

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; turf?: string }> }) {
  const { q = '', status = '', turf = '' } = await searchParams;
  const db = await getDb();
  const search = q.trim().toLowerCase();
  const all = db.bookings
    .filter((b) => !status || b.status === status)
    .filter((b) => !turf || b.turfId === turf)
    .filter((b) => !search || b.customerName.toLowerCase().includes(search) || b.customerPhone.includes(search) || b.code.toLowerCase().includes(search))
    .sort((a, b) => b.date.localeCompare(a.date) || b.hour - a.hour);
  const shown = all.slice(0, 150);
  const turfName = (id: string) => db.turfs.find((t) => t.id === id)?.name ?? id;

  return (
    <div className={dash.page}>
      <PageHeader title="Bookings & refunds" desc="Every booking across all turfs. Refunds go to the player's OYUN wallet." />

      <div className={dash.stats}>
        <Stat label="Matching bookings" value={all.length} />
        <Stat label="Booking value" value={inr(all.reduce((s, b) => s + bookingRevenue(b), 0))} />
        <Stat label="Refunded" value={inr(all.filter((b) => b.status === 'refunded').reduce((s, b) => s + b.amountPaid, 0))} />
      </div>

      <div className={dash.card}>
        <div className={dash.cardHeader}>
          <form className={dash.inline}>
            <input name="q" defaultValue={q} placeholder="Name, phone or code" className={dash.input} style={{ width: 200 }} />
            <select name="turf" defaultValue={turf} className={dash.select} style={{ width: 180 }}>
              <option value="">All turfs</option>
              {db.turfs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select name="status" defaultValue={status} className={dash.select} style={{ width: 150 }}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <button className={`${dash.btn} ${dash.btnSecondary}`}>Filter</button>
          </form>
        </div>
        <div className={dash.tableWrap} tabIndex={0} role="region" aria-label="Table, scrolls sideways">
          <table className={dash.table}>
            <thead>
              <tr>
                <th>Date & slot</th><th>Turf</th><th>Player</th><th>Code</th><th>Payment</th><th>Status</th>
                <th className={dash.num}>Total</th><th className={dash.num}>Paid</th><th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b.id}>
                  <td className={dash.strong}>{formatDate(b.date)} · {b.timeLabel}{halfNote(b.pitch)}</td>
                  <td>{turfName(b.turfId)}</td>
                  <td>{b.customerName}<div className={dash.muted}>{b.customerPhone}</div></td>
                  <td className={dash.muted}>{b.code}</td>
                  <td>{b.source === 'walk_in' ? 'Walk-in' : 'Online'} · {b.paymentMode === 'venue' ? 'pay at venue' : b.paymentMode}</td>
                  <td><Badge status={b.status} /></td>
                  <td className={dash.num}>{inr(b.pricing.total)}</td>
                  <td className={dash.num}>{inr(b.amountPaid)}</td>
                  <td>
                    <div className={dash.inline}>
                      <Link href={`/bookings/${b.id}/invoice`} target="_blank" className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Invoice</Link>
                      {!['cancelled', 'refunded'].includes(b.status) && (
                        <ActionForm action={refundBooking} inline confirm={`Refund ₹${b.amountPaid} to ${b.customerName}'s wallet?`}>
                          <input type="hidden" name="bookingId" value={b.id} />
                          <button className={`${dash.btn} ${dash.btnDanger} ${dash.btnSm}`}>Refund</button>
                        </ActionForm>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {all.length > shown.length && <p className={dash.muted}>Showing {shown.length} of {all.length}. Use the filters to narrow down.</p>}
      </div>
    </div>
  );
}
