import Link from 'next/link';
import { Badge, PageHeader, Stat, dash, inr } from '@/components/dash/ui';
import { commissionFor } from '@/lib/pricing';
import { bookingRevenue, onlineCollected } from '@/lib/reports';
import { getDb, storageInfo } from '@/lib/store';
import { formatDate, istNow } from '@/lib/time';
import PendingApplications from './PendingApplications';

export default async function AdminOverview() {
  const db = await getDb();
  const now = istNow();
  const month = now.date.slice(0, 7);
  const monthBookings = db.bookings.filter((b) => b.date.startsWith(month));
  const gmv = monthBookings.reduce((s, b) => s + bookingRevenue(b), 0);
  const commission = monthBookings.reduce((s, b) => {
    const turf = db.turfs.find((t) => t.id === b.turfId);
    return s + (turf ? Math.round((onlineCollected(b) * commissionFor(db, turf)) / 100) : 0);
  }, 0);
  const pending = db.applications.filter((a) => a.status === 'pending').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const reviewed = db.applications.filter((a) => a.status !== 'pending').sort((a, b) => (b.reviewedAt ?? '').localeCompare(a.reviewedAt ?? '')).slice(0, 5);
  const turfName = (id: string) => db.turfs.find((t) => t.id === id)?.name ?? id;
  const recent = [...db.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  return (
    <div className={dash.page}>
      <PageHeader title="Platform overview" desc={formatDate(now.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />

      {!storageInfo().shared && (
        <div className={dash.card} role="alert" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
          <h2 className={dash.cardTitle} style={{ color: '#991b1b' }}>⚠️ Bookings are not being saved</h2>
          <p className={dash.cardDesc} style={{ color: '#7f1d1d' }}>
            The database isn&apos;t connected, so each server keeps its own temporary copy: players can&apos;t see each other&apos;s
            holds and bookings can disappear. Add <code>SUPABASE_SECRET_KEY</code> in Vercel, run the SQL in
            <code> supabase/migrations</code>, then redeploy. See docs/GO-LIVE.md.
          </p>
        </div>
      )}

      <div className={dash.stats}>
        <Stat label="Pending approvals" value={pending.length} />
        <Stat label="Live turfs" value={db.turfs.filter((t) => t.status === 'active').length} hint={`${db.turfs.filter((t) => t.isVerified).length} verified`} />
        <Stat label="Players" value={db.players.length} hint={`${db.players.filter((p) => p.status === 'banned').length} banned`} />
        <Stat label="Bookings this month" value={monthBookings.filter((b) => bookingRevenue(b) > 0).length} />
        <Stat label="Collected this month" value={inr(gmv)} />
        <Stat label="Commission this month" value={inr(commission)} hint={`Default rate ${db.settings.commissionPercent}%`} />
      </div>

      <div className={dash.card}>
        <div className={dash.cardHeader}>
          <div>
            <h2 className={dash.cardTitle}>Listing applications</h2>
            <p className={dash.cardDesc}>Submitted from the “List your turf” page. Approving creates the turf and a partner login.</p>
          </div>
          <Badge status="pending" label={`${pending.length} pending`} />
        </div>
        <PendingApplications applications={pending} />
      </div>

      <div className={dash.grid2}>
        <div className={dash.card}>
          <div className={dash.cardHeader}>
            <h2 className={dash.cardTitle}>Latest bookings</h2>
            <Link href="/admin/transactions" className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>All bookings</Link>
          </div>
          <div className={dash.list}>
            {recent.map((b) => (
              <div key={b.id} className={dash.listItem}>
                <div>
                  <div className={dash.strong}>{b.customerName} · {inr(b.pricing.total)}</div>
                  <div className={dash.muted}>{turfName(b.turfId)} · {formatDate(b.date)} {b.timeLabel}</div>
                </div>
                <Badge status={b.status} />
              </div>
            ))}
          </div>
        </div>

        <div className={dash.card}>
          <div className={dash.cardHeader}><h2 className={dash.cardTitle}>Recently reviewed</h2></div>
          {reviewed.length === 0 ? (
            <p className={dash.empty}>Nothing reviewed yet.</p>
          ) : (
            <div className={dash.list}>
              {reviewed.map((a) => (
                <div key={a.id} className={dash.listItem}>
                  <div>
                    <div className={dash.strong}>{a.turfName}</div>
                    <div className={dash.muted}>{a.ownerName}{a.note ? ` · ${a.note}` : ''}</div>
                  </div>
                  <div className={dash.inline}>
                    <Badge status={a.status} />
                    {a.turfId && <Link href={`/admin/turfs/${a.turfId}`} className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Edit turf</Link>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
