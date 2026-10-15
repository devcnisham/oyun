import { PageHeader, Stat, dash, inr, tableScroll } from '@/components/dash/ui';
import { requirePartner } from '@/lib/partner-auth';
import { turfHours } from '@/lib/pricing';
import { bookingRevenue } from '@/lib/reports';
import { getDb } from '@/lib/store';
import { addDays, formatDate, formatHour, istNow } from '@/lib/time';
import styles from './analytics.module.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default async function PartnerAnalyticsPage() {
  const ctx = await requirePartner('payouts');
  const db = await getDb();
  const now = istNow();
  const since = addDays(now.date, -29);

  const all = db.bookings.filter((b) => b.turfId === ctx.turf.id);
  const live = (b: (typeof all)[number]) => !['cancelled', 'refunded'].includes(b.status);
  const recent = all.filter((b) => b.date >= since && b.date <= now.date);
  const recentLive = recent.filter(live);

  // Headline numbers (last 30 days)
  const revenue = recentLive.reduce((s, b) => s + bookingRevenue(b), 0);
  const avgValue = recentLive.length ? Math.round(revenue / recentLive.length) : 0;
  const hoursPerDay = turfHours(ctx.turf).length;
  const capacity = hoursPerDay * 30;
  const bookedSlots = recentLive.reduce((n, b) => n + (b.hours && b.hours.length > 0 ? b.hours.length : 1), 0);
  const occupancy = capacity ? Math.min(100, Math.round((bookedSlots / capacity) * 100)) : 0;
  const attended = recent.filter((b) => b.status === 'checked_in').length;
  const noShows = recent.filter((b) => b.status === 'no_show').length;
  const attendance = attended + noShows ? Math.round((attended / (attended + noShows)) * 100) : 100;
  const cancelled = recent.filter((b) => !live(b)).length;
  const cancelRate = recent.length ? Math.round((cancelled / recent.length) * 100) : 0;

  // Revenue trend, last 14 days
  const trend = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(now.date, i - 13);
    return { date, value: all.filter((b) => b.date === date && live(b)).reduce((s, b) => s + bookingRevenue(b), 0) };
  });
  const trendMax = Math.max(1, ...trend.map((t) => t.value));

  // Busiest hours and weekdays (last 90 days, active bookings)
  const window90 = all.filter((b) => b.date >= addDays(now.date, -89) && b.date <= now.date && live(b));
  const byHour = turfHours(ctx.turf).map((hour) => ({
    hour,
    count: window90.filter((b) => (b.hours && b.hours.length > 0 ? b.hours.includes(hour) : b.hour === hour)).length,
  }));
  const hourMax = Math.max(1, ...byHour.map((h) => h.count));
  const byDay = DAYS.map((label, d) => ({
    label,
    count: window90.filter((b) => new Date(`${b.date}T12:00:00Z`).getUTCDay() === d).length,
  }));
  const dayMax = Math.max(1, ...byDay.map((d) => d.count));

  // Online vs walk-in
  const online = recentLive.filter((b) => b.source === 'online').length;
  const walkIn = recentLive.length - online;

  // Top customers (last 90 days)
  const customers = new Map<string, { name: string; phone: string; bookings: number; spend: number }>();
  for (const b of window90) {
    const key = b.customerPhone || b.customerName;
    const c = customers.get(key) ?? { name: b.customerName, phone: b.customerPhone, bookings: 0, spend: 0 };
    c.bookings += 1;
    c.spend += bookingRevenue(b);
    customers.set(key, c);
  }
  const top = [...customers.values()].sort((a, b) => b.bookings - a.bookings || b.spend - a.spend).slice(0, 8);
  const repeat = [...customers.values()].filter((c) => c.bookings > 1).length;
  const repeatRate = customers.size ? Math.round((repeat / customers.size) * 100) : 0;

  return (
    <div className={dash.page}>
      <PageHeader title="Analytics" desc={`${ctx.turf.name}: how the last 30 days went, and when and who books.`} />

      <div className={dash.stats}>
        <Stat label="Revenue (30 days)" value={inr(revenue)} hint={`${recentLive.length} bookings`} />
        <Stat label="Average booking" value={inr(avgValue)} />
        <Stat label="Occupancy" value={`${occupancy}%`} hint={`${bookedSlots} of ${capacity} slots`} />
        <Stat label="Attendance" value={`${attendance}%`} hint={`${noShows} no-show${noShows === 1 ? '' : 's'}`} />
        <Stat label="Cancellations" value={`${cancelRate}%`} hint={`${cancelled} cancelled`} />
        <Stat label="Repeat customers" value={`${repeatRate}%`} hint={`${repeat} of ${customers.size} (90 days)`} />
      </div>

      <div className={dash.card}>
        <div className={dash.cardHeader}>
          <div>
            <h2 className={dash.cardTitle}>Revenue, last 14 days</h2>
            <p className={dash.cardDesc}>Collected plus venue-paid revenue per day.</p>
          </div>
        </div>
        <div className={styles.chart}>
          {trend.map((t) => (
            <div key={t.date} className={styles.col} title={`${formatDate(t.date)}: ${inr(t.value)}`}>
              <span className={styles.val}>{t.value > 0 ? inr(t.value) : ''}</span>
              <div className={`${styles.bar} ${t.date === now.date ? styles.today : ''}`} style={{ height: `${Math.max(3, Math.round((t.value / trendMax) * 100))}%` }} />
              <span className={styles.lbl}>{Number(t.date.slice(8))}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={dash.card}>
          <h2 className={dash.cardTitle}>Busiest hours</h2>
          <p className={dash.cardDesc}>Bookings per hour, last 90 days.</p>
          <div className={styles.chart}>
            {byHour.map((h) => (
              <div key={h.hour} className={styles.col} title={`${formatHour(h.hour)}: ${h.count} bookings`}>
                <span className={styles.val}>{h.count || ''}</span>
                <div className={`${styles.bar} ${h.count === hourMax && h.count > 0 ? styles.peak : ''}`} style={{ height: `${Math.max(3, Math.round((h.count / hourMax) * 100))}%` }} />
                <span className={styles.lbl}>{h.hour}h</span>
              </div>
            ))}
          </div>
        </div>

        <div className={dash.card}>
          <h2 className={dash.cardTitle}>Busiest days</h2>
          <p className={dash.cardDesc}>Bookings per weekday, last 90 days.</p>
          <div className={styles.chart}>
            {byDay.map((d) => (
              <div key={d.label} className={styles.col} title={`${d.label}: ${d.count} bookings`}>
                <span className={styles.val}>{d.count || ''}</span>
                <div className={`${styles.bar} ${d.count === dayMax && d.count > 0 ? styles.peak : ''}`} style={{ height: `${Math.max(3, Math.round((d.count / dayMax) * 100))}%` }} />
                <span className={styles.lbl}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={dash.card}>
          <h2 className={dash.cardTitle}>Online vs walk-in</h2>
          <p className={dash.cardDesc}>Where bookings come from, last 30 days.</p>
          <div className={styles.split} style={{ marginTop: 16 }}>
            <div className={styles.splitOnline} style={{ width: `${recentLive.length ? (online / recentLive.length) * 100 : 0}%` }} />
            <div className={styles.splitWalk} style={{ width: `${recentLive.length ? (walkIn / recentLive.length) * 100 : 0}%` }} />
          </div>
          <div className={styles.splitLegend}>
            <span><i className={`${styles.dot} ${styles.splitOnline}`} />Online: {online}</span>
            <span><i className={`${styles.dot} ${styles.splitWalk}`} />Walk-in: {walkIn}</span>
          </div>
        </div>

        <div className={dash.card}>
          <h2 className={dash.cardTitle}>Top customers</h2>
          <p className={dash.cardDesc}>Most bookings in the last 90 days.</p>
          {top.length === 0 ? (
            <p className={dash.empty}>No bookings yet.</p>
          ) : (
            <div {...tableScroll}>
              <table className={dash.table}>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th className={dash.num}>Bookings</th>
                    <th className={dash.num}>Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((c) => (
                    <tr key={c.phone || c.name}>
                      <td>
                        {c.name}
                        {c.phone && <div className={dash.muted}>{c.phone}</div>}
                      </td>
                      <td className={dash.num}>{c.bookings}</td>
                      <td className={dash.num}>{inr(c.spend)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
