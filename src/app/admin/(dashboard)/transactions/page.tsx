import Link from 'next/link';
import ActionForm from '@/modules/shared/frontend/dash/ActionForm';
import { Badge, PageHeader, Stat, dash, inr, tableScroll } from '@/modules/shared/frontend/dash/ui';
import { refundBooking } from '@/modules/admin/backend/admin-actions';
import { bookingRevenue } from '@/modules/shared/lib/reports';
import { getDb } from '@/modules/shared/database/store';
import { formatDate } from '@/modules/shared/lib/time';
import type { BookingStatus } from '@/modules/shared/database/types';
import { halfNote } from '@/modules/shared/lib/pricing';
import { paginate } from '@/modules/shared/lib/paginate';
import Pager from '@/modules/shared/frontend/dash/Pager';

const STATUSES: BookingStatus[] = ['confirmed', 'checked_in', 'no_show', 'cancelled', 'refunded'];

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; turf?: string; page?: string }> }) {
  const { q = '', status = '', turf = '', page: pageParam } = await searchParams;
  const db = await getDb();
  const search = q.trim().toLowerCase();
  const all = db.bookings
    .filter((b) => !status || b.status === status)
    .filter((b) => !turf || b.turfId === turf)
    .filter((b) => !search || b.customerName.toLowerCase().includes(search) || b.customerPhone.includes(search) || b.code.toLowerCase().includes(search))
    .sort((a, b) => b.date.localeCompare(a.date) || b.hour - a.hour);
  const paged = paginate(all, pageParam, 50);
  const shown = paged.items;
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
            <input name="q" aria-label="Search bookings by name, phone or code" defaultValue={q} placeholder="Name, phone or code" className={dash.input} style={{ width: 200 }} />
            <select name="turf" defaultValue={turf} className={dash.select} style={{ width: 180 }}>
              <option value="">All venues</option>
              {db.turfs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select name="status" defaultValue={status} className={dash.select} style={{ width: 150 }}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <button className={`${dash.btn} ${dash.btnSecondary}`}>Filter</button>
          </form>
        </div>
        <div {...tableScroll}>
          <table className={dash.table}>
            <thead>
              <tr>
                <th>Date & slot</th><th>Venue</th><th>Player</th><th>Code</th><th>Payment</th><th>Status</th>
                <th className={dash.num}>Total</th><th className={dash.num}>Paid</th><th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b.id}>
                  <td className={dash.strong}>{formatDate(b.date)} · {b.timeLabel}{halfNote(b.pitch, db.turfs.find((t) => t.id === b.turfId)?.halfNames)}</td>
                  <td>{turfName(b.turfId)}</td>
                  <td>{b.customerName}<div className={dash.muted}>{b.customerPhone}</div></td>
                  <td className={dash.muted}>{b.code}</td>
                  <td>{b.source === 'walk_in' ? 'Walk-in' : 'Online'} · {b.paymentMode === 'venue' ? 'pay at venue' : b.paymentMode}</td>
                  <td><Badge status={b.status} /></td>
                  <td className={dash.num}>{inr(b.pricing.total)}</td>
                  <td className={dash.num}>{inr(b.amountPaid)}</td>
                  <td>
                    <div className={dash.inline}>
                      <Link href={`/bookings/${b.id}/invoice`} className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Invoice</Link>
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
        <Pager info={paged} basePath="/admin/transactions" params={{ q, status, turf }} />
      </div>
    </div>
  );
}
