import Link from 'next/link';
import ActionForm from '@/components/dash/ActionForm';
import { Badge, PageHeader, Tabs, dash, inr, tableScroll } from '@/components/dash/ui';
import { requirePartner } from '@/lib/partner-auth';
import { cancelBooking } from '@/lib/partner-actions';
import { getDb } from '@/lib/store';
import { addDays, formatDate, istNow } from '@/lib/time';
import WalkInForm from './WalkInForm';
import { halfNote } from '@/lib/pricing';
import { paginate } from '@/lib/paginate';
import Pager from '@/components/dash/Pager';

const VIEWS = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default async function PartnerBookings({ searchParams }: { searchParams: Promise<{ view?: string; q?: string; page?: string }> }) {
  const ctx = await requirePartner('bookings');
  const { view: rawView, q = '', page: pageParam } = await searchParams;
  const view = VIEWS.some((v) => v.key === rawView) ? rawView! : 'today';
  const db = await getDb();
  const now = istNow();
  const search = q.trim().toLowerCase();

  let list = db.bookings.filter((b) => b.turfId === ctx.turf.id);
  if (view === 'today') list = list.filter((b) => b.date === now.date && !['cancelled', 'refunded'].includes(b.status));
  if (view === 'upcoming') list = list.filter((b) => b.date > now.date && b.status === 'confirmed');
  if (view === 'past') list = list.filter((b) => b.date < now.date && !['cancelled', 'refunded'].includes(b.status));
  if (view === 'cancelled') list = list.filter((b) => ['cancelled', 'refunded'].includes(b.status));
  if (search) list = list.filter((b) => b.customerName.toLowerCase().includes(search) || b.customerPhone.includes(search) || b.code.toLowerCase().includes(search));
  list.sort((a, b) => (view === 'past' || view === 'cancelled' ? b.date.localeCompare(a.date) || b.hour - a.hour : a.date.localeCompare(b.date) || a.hour - b.hour));
  const paged = paginate(list, pageParam, 50);
  const shown = paged.items;

  return (
    <div className={dash.page}>
      <PageHeader title="Bookings" desc={`All bookings for ${ctx.turf.name}, online and walk-in.`} />

      <div className={dash.card} id="walk-in">
        <div className={dash.cardHeader}>
          <div>
            <h2 className={dash.cardTitle}>New walk-in booking</h2>
            <p className={dash.cardDesc}>For players who book at the counter or over the phone.</p>
          </div>
        </div>
        <WalkInForm
          turfId={ctx.turf.id}
          today={now.date}
          maxDate={addDays(now.date, 14)}
          addOns={db.addOns.filter((a) => a.turfId === ctx.turf.id && a.active)}
        />
      </div>

      <div className={dash.card}>
        <div className={dash.cardHeader}>
          <Tabs items={VIEWS.map((v) => ({ ...v, href: `/partner/bookings?view=${v.key}` }))} active={view} />
          <form className={dash.inline}>
            <input type="hidden" name="view" value={view} />
            <input name="q" aria-label="Search bookings by name, phone or code" defaultValue={q} placeholder="Name, phone or code" className={dash.input} style={{ width: 220 }} />
            <button className={`${dash.btn} ${dash.btnSecondary}`}>Search</button>
          </form>
        </div>
        {shown.length === 0 ? (
          <p className={dash.empty}>No bookings here.</p>
        ) : (
          <div {...tableScroll}>
            <table className={dash.table}>
              <thead>
                <tr>
                  <th>Date & slot</th><th>Player</th><th>Code</th><th>Source</th><th>Status</th>
                  <th className={dash.num}>Total</th><th className={dash.num}>Paid</th><th></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((b) => (
                  <tr key={b.id}>
                    <td className={dash.strong}>{formatDate(b.date)} · {b.timeLabel}{halfNote(b.pitch, ctx.turf.halfNames)}</td>
                    <td>{b.customerName}<div className={dash.muted}>{b.customerPhone}</div></td>
                    <td className={dash.muted}>{b.code}</td>
                    <td>{b.source === 'walk_in' ? `Walk-in (${b.paymentMode})` : b.paymentMode === 'venue' ? 'Online · pay at venue' : `Online (${b.paymentMode})`}</td>
                    <td><Badge status={b.status} /></td>
                    <td className={dash.num}>{inr(b.pricing.total)}</td>
                    <td className={dash.num}>{inr(b.status === 'checked_in' ? b.pricing.total : b.amountPaid)}</td>
                    <td>
                      <div className={dash.inline}>
                        <Link href={`/partner/invoices/${b.id}`} className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Invoice</Link>
                        {b.status === 'confirmed' && (
                          <ActionForm action={cancelBooking} inline confirm={`Cancel ${b.customerName}'s booking?`}>
                            <input type="hidden" name="bookingId" value={b.id} />
                            <button className={`${dash.btn} ${dash.btnDanger} ${dash.btnSm}`}>Cancel</button>
                          </ActionForm>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager info={paged} basePath="/partner/bookings" params={{ view, q }} />
      </div>
    </div>
  );
}
