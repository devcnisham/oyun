import Link from 'next/link';
import { Badge, PageHeader, Stat, dash, inr } from '@/components/dash/ui';
import { requirePartner } from '@/lib/partner-auth';
import { bookingRevenue } from '@/lib/reports';
import { getDb } from '@/lib/store';
import { addDays, formatDate, formatSlotRange, istNow } from '@/lib/time';
import { blockSlot } from '@/lib/partner-actions';
import styles from './layout.module.css';

export default async function PartnerDashboard() {
  const ctx = await requirePartner();
  const db = getDb();
  const now = istNow();
  const monthPrefix = now.date.slice(0, 7);
  const bookings = db.bookings.filter((b) => b.turfId === ctx.turf.id);

  const thisMonth = bookings.filter((b) => b.date.startsWith(monthPrefix));
  const revenue = thisMonth.reduce((s, b) => s + bookingRevenue(b), 0);
  const today = bookings.filter((b) => b.date === now.date && b.status !== 'cancelled' && b.status !== 'refunded').sort((a, b) => a.hour - b.hour);
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && b.date > now.date && b.date <= addDays(now.date, 7));
  const pastWeek = bookings.filter((b) => b.date >= addDays(now.date, -30) && b.date < now.date);
  const noShows = pastWeek.filter((b) => b.status === 'no_show').length;
  const attended = pastWeek.filter((b) => b.status === 'checked_in').length;

  const days = Array.from({ length: 7 }, (_, i) => addDays(now.date, i - 6));
  const daily = days.map((d) => ({ date: d, value: bookings.filter((b) => b.date === d).reduce((s, b) => s + bookingRevenue(b), 0) }));
  const max = Math.max(1, ...daily.map((d) => d.value));

  const recent = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  return (
    <div className={dash.page}>
      <PageHeader title={`Hello, ${ctx.userName.split(' ')[0]}`} desc={`Here's how ${ctx.turf.name} is doing today.`}>
        {ctx.can('bookings') && <Link href="/partner/bookings#walk-in" className={dash.btn}>+ Walk-in booking</Link>}
        {ctx.can('checkin') && <Link href="/partner/check-in" className={`${dash.btn} ${dash.btnSecondary}`}>Check in a player</Link>}
      </PageHeader>

      <div className={dash.stats}>
        {ctx.can('payouts') && <Stat label="Revenue this month" value={inr(revenue)} hint={`${thisMonth.filter((b) => bookingRevenue(b) > 0).length} paid bookings`} />}
        <Stat label="Today" value={today.length} hint={`${today.filter((b) => b.status === 'checked_in').length} checked in`} />
        <Stat label="Next 7 days" value={upcoming.length} hint="upcoming bookings" />
        <Stat label="No-show rate (30 days)" value={`${attended + noShows ? Math.round((noShows / (attended + noShows)) * 100) : 0}%`} hint={`${noShows} no-shows`} />
      </div>

      <div className={dash.grid2}>
        {ctx.can('payouts') ? (
          <div className={dash.card}>
            <div className={dash.cardHeader}>
              <h2 className={dash.cardTitle}>Revenue — last 7 days</h2>
              <Link href="/partner/payouts" className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Payouts</Link>
            </div>
            <div className={dash.chart}>
              {daily.map((d) => (
                <div key={d.date} className={dash.chartCol}>
                  <span className={dash.chartValue}>{d.value ? `₹${Math.round(d.value / 100) / 10}k` : ''}</span>
                  <div className={dash.chartBar} style={{ height: `${(d.value / max) * 100}%` }} />
                  <span className={dash.chartLabel}>{formatDate(d.date, { weekday: 'short' })}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className={dash.card}>
          <div className={dash.cardHeader}>
            <h2 className={dash.cardTitle}>Today&apos;s schedule</h2>
            {ctx.can('checkin') && <Link href="/partner/check-in" className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Check-in desk</Link>}
          </div>
          {today.length === 0 ? (
            <p className={dash.empty}>No bookings today.</p>
          ) : (
            <div className={dash.list}>
              {today.map((b) => (
                <div key={b.id} className={dash.listItem}>
                  <div>
                    <div className={dash.strong}>{formatSlotRange(b.hour)}</div>
                    <div className={dash.muted}>{b.customerName} · {b.source === 'walk_in' ? 'Walk-in' : 'Online'}</div>
                  </div>
                  <Badge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={dash.card}>
        <div className={dash.cardHeader}>
          <h2 className={dash.cardTitle}>Latest bookings</h2>
          {ctx.can('bookings') && <Link href="/partner/bookings" className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>View all</Link>}
        </div>
        <div className={dash.tableWrap}>
          <table className={dash.table}>
            <thead>
              <tr><th>Player</th><th>Slot</th><th>Source</th><th>Status</th><th className={dash.num}>Total</th></tr>
            </thead>
            <tbody>
              {recent.map((b) => (
                <tr key={b.id}>
                  <td className={dash.strong}>{b.customerName}</td>
                  <td>{formatDate(b.date)} · {b.timeLabel}</td>
                  <td>{b.source === 'walk_in' ? 'Walk-in' : 'Online'}</td>
                  <td><Badge status={b.status} /></td>
                  <td className={dash.num}>{inr(b.pricing.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Slot Management */}
      <div className={dash.card} style={{ marginTop: '48px' }}>
        <div className={dash.cardHeader}>
          <h2 className={dash.cardTitle}>Manual Slot Management</h2>
          <p className={dash.cardDesc} style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
            Block slots for maintenance or offline phone bookings
          </p>
        </div>

        <form
          className={styles.slotBlockerForm}
          action={async (formData) => {
            "use server";
            await blockSlot({} as any, formData);
          }}
        >
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label className={dash.label} style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Date</label>
            <input type="date" name="date" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} required />
          </div>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label className={dash.label} style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Time Slot</label>
            <select name="hour" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} required>
              <option value="18">6:00 PM – 7:00 PM</option>
              <option value="19">7:00 PM – 8:00 PM</option>
              <option value="20">8:00 PM – 9:00 PM</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label className={dash.label} style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Reason</label>
            <input type="text" name="reason" placeholder="e.g., Maintenance / Phone booking" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} required />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className={dash.btn} style={{ height: '42px', padding: '0 24px', background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
              Block Slot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
