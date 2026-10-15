import Link from 'next/link';
import { Badge, PageHeader, Stat, dash, inr, tableScroll } from '@/components/dash/ui';
import { requirePartner } from '@/lib/partner-auth';
import { bookingRevenue } from '@/lib/reports';
import { getDb } from '@/lib/store';
import { addDays, formatDate, formatHour, formatSlotRange, istNow } from '@/lib/time';
import ActionForm from '@/components/dash/ActionForm';
import { blockSlot, unblockSlot } from '@/lib/partner-actions';
import { halfNote, turfHours } from '@/lib/pricing';
import styles from './layout.module.css';

export default async function PartnerDashboard() {
  const ctx = await requirePartner();
  const db = await getDb();
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

  const operatingHours = turfHours(ctx.turf);
  const todayOccupancy = operatingHours.length > 0 ? Math.min(100, Math.round((today.length / operatingHours.length) * 100)) : 0;

  const days = Array.from({ length: 7 }, (_, i) => addDays(now.date, i - 6));
  const daily = days.map((d) => ({ date: d, value: bookings.filter((b) => b.date === d).reduce((s, b) => s + bookingRevenue(b), 0) }));
  const max = Math.max(1, ...daily.map((d) => d.value));
  const weeklyRevenue = daily.reduce((sum, d) => sum + d.value, 0);

  const recent = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const activeBlocks = db.blocks
    .filter((b) => b.turfId === ctx.turf.id && b.date >= now.date)
    .sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);

  return (
    <div className={dash.page}>
      <PageHeader title={`Hello, ${ctx.userName.split(' ')[0]}`} desc={`Here's how ${ctx.turf.name} is performing today.`}>
        {ctx.can('bookings') && <Link href="/partner/bookings#walk-in" className={dash.btn}>+ Walk-in booking</Link>}
        {ctx.can('checkin') && <Link href="/partner/check-in" className={`${dash.btn} ${dash.btnSecondary}`}>📷 Scan QR / Check-in</Link>}
      </PageHeader>

      <div className={dash.stats}>
        {ctx.can('payouts') && <Stat label="Revenue this month" value={inr(revenue)} hint={`${thisMonth.filter((b) => bookingRevenue(b) > 0).length} paid bookings`} />}
        <Stat label="Today's bookings" value={today.length} hint={`${today.filter((b) => b.status === 'checked_in').length} checked in (${todayOccupancy}% occupancy)`} />
        <Stat label="Next 7 days" value={upcoming.length} hint="confirmed pipeline" />
        <Stat label="No-show rate (30 days)" value={`${attended + noShows ? Math.round((noShows / (attended + noShows)) * 100) : 0}%`} hint={`${noShows} no-shows`} />
      </div>

      <div className={dash.grid2}>
        {ctx.can('payouts') ? (
          <div className={dash.card}>
            <div className={dash.cardHeader}>
              <div>
                <h2 className={dash.cardTitle}>Revenue — last 7 days</h2>
                <p className={dash.cardDesc}>Total: {inr(weeklyRevenue)}</p>
              </div>
              <Link href="/partner/payouts" className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Payouts</Link>
            </div>
            <div className={dash.chart}>
              {daily.map((d) => {
                const isToday = d.date === now.date;
                return (
                  <div key={d.date} className={dash.chartCol}>
                    <span className={dash.chartValue}>{d.value ? `₹${Math.round(d.value / 100) / 10}k` : ''}</span>
                    <div
                      className={dash.chartBar}
                      style={{
                        height: `${(d.value / max) * 100}%`,
                        background: isToday ? 'var(--brand, #10b981)' : undefined,
                        opacity: isToday ? 1 : 0.8,
                      }}
                      title={`${formatDate(d.date)}: ${inr(d.value)}`}
                    />
                    <span className={dash.chartLabel} style={{ fontWeight: isToday ? 700 : 400 }}>
                      {formatDate(d.date, { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className={dash.card}>
          <div className={dash.cardHeader}>
            <div>
              <h2 className={dash.cardTitle}>Today&apos;s schedule</h2>
              <p className={dash.cardDesc}>{formatDate(now.date, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            </div>
            {ctx.can('checkin') && <Link href="/partner/check-in" className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Check-in desk</Link>}
          </div>
          {today.length === 0 ? (
            <p className={dash.empty}>No bookings scheduled today.</p>
          ) : (
            <div className={dash.list}>
              {today.map((b) => {
                const isNow = b.hour === now.hour;
                return (
                  <div key={b.id} className={dash.listItem} style={{ borderLeft: isNow ? '3px solid var(--brand, #10b981)' : undefined }}>
                    <div>
                      <div className={dash.strong} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{formatSlotRange(b.hour)}{halfNote(b.pitch)}</span>
                        {isNow && (
                          <span style={{ fontSize: 10, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                            NOW
                          </span>
                        )}
                      </div>
                      <div className={dash.muted}>{b.customerName} · {b.source === 'walk_in' ? 'Walk-in' : 'Online'} · {b.code}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Badge status={b.status} />
                      {b.status === 'confirmed' && ctx.can('checkin') && (
                        <Link href={`/partner/check-in?code=${b.code}`} className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>
                          Check in
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={dash.card}>
        <div className={dash.cardHeader}>
          <div>
            <h2 className={dash.cardTitle}>Latest bookings</h2>
            <p className={dash.cardDesc}>Recent activity across all channels</p>
          </div>
          {ctx.can('bookings') && <Link href="/partner/bookings" className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>View all bookings</Link>}
        </div>
        <div {...tableScroll}>
          <table className={dash.table}>
            <thead>
              <tr><th>Player</th><th>Contact</th><th>Slot</th><th>Source</th><th>Status</th><th className={dash.num}>Total</th></tr>
            </thead>
            <tbody>
              {recent.map((b) => (
                <tr key={b.id}>
                  <td className={dash.strong}>{b.customerName}</td>
                  <td className={dash.muted}>{b.customerPhone}</td>
                  <td>{formatDate(b.date)} · {b.timeLabel}{halfNote(b.pitch)}</td>
                  <td>
                    <span style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, background: b.source === 'walk_in' ? 'var(--bg-muted)' : 'rgba(59, 130, 246, 0.1)', color: b.source === 'walk_in' ? 'inherit' : '#3b82f6' }}>
                      {b.source === 'walk_in' ? 'Walk-in' : 'Online'}
                    </span>
                  </td>
                  <td><Badge status={b.status} /></td>
                  <td className={dash.num}>{inr(b.pricing.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Slot Management */}
      <div className={dash.card} style={{ marginTop: '24px' }}>
        <div className={dash.cardHeader}>
          <div>
            <h2 className={dash.cardTitle}>Manual Slot Management</h2>
            <p className={dash.cardDesc}>
              Block slots for offline bookings, turf maintenance, or private events
            </p>
          </div>
          <Link href="/partner/slots" className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Full slot grid</Link>
        </div>

        <ActionForm action={blockSlot} className={styles.slotBlockerForm} resetOnSuccess>
          <label className={dash.field} style={{ flex: 1, minWidth: '180px' }}>
            <span className={dash.label}>Date</span>
            <input type="date" name="date" min={now.date} defaultValue={now.date} className={dash.input} required />
          </label>
          <label className={dash.field} style={{ flex: 1, minWidth: '180px' }}>
            <span className={dash.label}>Time slot</span>
            <select name="hour" className={dash.select} required>
              {turfHours(ctx.turf).map((h) => (
                <option key={h} value={h}>{formatHour(h)}</option>
              ))}
            </select>
          </label>
          <label className={dash.field} style={{ flex: 1, minWidth: '180px' }}>
            <span className={dash.label}>Reason</span>
            <input type="text" name="reason" placeholder="e.g. Phone booking / Maintenance" className={dash.input} required />
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className={dash.btn} style={{ height: '42px', padding: '0 24px' }}>
              Block slot
            </button>
          </div>
        </ActionForm>

        {activeBlocks.length > 0 && (
          <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Active blocked slots ({activeBlocks.length})</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {activeBlocks.slice(0, 8).map((bl) => (
                <div
                  key={bl.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'var(--bg-muted)',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    border: '1px solid var(--border)',
                  }}
                >
                  <span>
                    <strong>{formatDate(bl.date, { month: 'short', day: 'numeric' })}</strong> {formatHour(bl.hour)} — {bl.reason}
                  </span>
                  <ActionForm action={unblockSlot} inline>
                    <input type="hidden" name="blockId" value={bl.id} />
                    <button
                      type="submit"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0 4px',
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                      title="Reopen slot"
                    >
                      ✕
                    </button>
                  </ActionForm>
                </div>
              ))}
              {activeBlocks.length > 8 && (
                <Link href="/partner/slots" style={{ alignSelf: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                  +{activeBlocks.length - 8} more
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
