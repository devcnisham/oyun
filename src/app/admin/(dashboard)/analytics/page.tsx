import { PageHeader, Stat, dash, inr, tableScroll } from '@/components/dash/ui';
import { computePlatformAnalytics } from '@/lib/analytics';
import { getDb } from '@/lib/store';
import { istNow } from '@/lib/time';

export default async function AdminAnalyticsPage() {
  const db = await getDb();
  const analytics = computePlatformAnalytics(db);
  const now = istNow();

  const maxHourlyCount = Math.max(...analytics.hourlyDistribution.map((h) => h.bookingsCount), 1);

  return (
    <div className={dash.page}>
      <PageHeader
        title="Analytics & Insights"
        desc={`Platform performance metrics as of ${now.date}. Area breakdown, busiest hours, and conversion rates.`}
      />

      <div className={dash.stats}>
        <Stat label="Total GMV" value={inr(analytics.totalGmv)} hint={`${analytics.activeBookings} active bookings`} />
        <Stat label="Online Collected" value={inr(analytics.totalOnlineCollected)} />
        <Stat label="Platform Commission" value={inr(analytics.totalCommissionEarned)} />
        <Stat label="Avg Order Value" value={inr(analytics.averageBookingValue)} />
        <Stat label="Check-in Rate" value={`${analytics.checkInRatePercent}%`} hint={`${analytics.checkedInBookings} checked in`} />
        <Stat label="Cancellation Rate" value={`${analytics.cancellationRatePercent}%`} hint={`${analytics.cancelledBookings} cancelled`} />
      </div>

      {/* Hourly booking distribution */}
      <div className={dash.card} style={{ marginBottom: '24px' }}>
        <div className={dash.cardHeader}>
          <div>
            <h2 className={dash.cardTitle}>Busiest Hours (Hourly Distribution)</h2>
            <p className={dash.cardDesc}>Booking volume across the day (5:00 PM – 10:00 PM are highlighted peak hours).</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '8px', padding: '16px 8px 0', overflowX: 'auto' }}>
          {analytics.hourlyDistribution.map((h) => {
            const heightPercent = Math.max(Math.round((h.bookingsCount / maxHourlyCount) * 100), 6);
            return (
              <div key={h.hour} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 0 32px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', marginBottom: '4px' }}>
                  {h.bookingsCount > 0 ? h.bookingsCount : ''}
                </span>
                <div
                  style={{
                    width: '100%',
                    height: `${heightPercent}px`,
                    backgroundColor: h.isPeak ? '#059669' : '#9ca3af',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.2s',
                  }}
                  title={`${h.label}: ${h.bookingsCount} bookings`}
                />
                <span style={{ fontSize: '10px', color: '#6b7280', marginTop: '6px', whiteSpace: 'nowrap' }}>
                  {h.hour}h
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={dash.grid2}>
        {/* Bookings & Revenue by Area */}
        <div className={dash.card}>
          <div className={dash.cardHeader}>
            <h2 className={dash.cardTitle}>Performance by Area</h2>
          </div>
          <div {...tableScroll}>
            <table className={dash.table}>
              <thead>
                <tr>
                  <th>Area</th>
                  <th className={dash.num}>Turfs</th>
                  <th className={dash.num}>Bookings</th>
                  <th className={dash.num}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.areaBreakdown.map((a) => (
                  <tr key={a.area}>
                    <td className={dash.strong}>{a.area}</td>
                    <td className={dash.num}>{a.turfCount}</td>
                    <td className={dash.num}>{a.bookingsCount}</td>
                    <td className={`${dash.num} ${dash.strong}`}>{inr(a.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sport Breakdown */}
        <div className={dash.card}>
          <div className={dash.cardHeader}>
            <h2 className={dash.cardTitle}>Performance by Sport</h2>
          </div>
          <div {...tableScroll}>
            <table className={dash.table}>
              <thead>
                <tr>
                  <th>Sport</th>
                  <th className={dash.num}>Bookings</th>
                  <th className={dash.num}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.sportBreakdown.map((s) => (
                  <tr key={s.sport}>
                    <td className={dash.strong}>{s.sport}</td>
                    <td className={dash.num}>{s.bookingsCount}</td>
                    <td className={`${dash.num} ${dash.strong}`}>{inr(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Performing Turfs */}
      <div className={dash.card} style={{ marginTop: '24px' }}>
        <div className={dash.cardHeader}>
          <h2 className={dash.cardTitle}>Top Venues by Revenue</h2>
        </div>
        <div {...tableScroll}>
          <table className={dash.table}>
            <thead>
              <tr>
                <th>Venue Name</th>
                <th>Area</th>
                <th className={dash.num}>Rating</th>
                <th className={dash.num}>Bookings</th>
                <th className={dash.num}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topTurfs.slice(0, 10).map((t) => (
                <tr key={t.id}>
                  <td className={dash.strong}>{t.name}</td>
                  <td>{t.area}</td>
                  <td className={dash.num}>{t.rating > 0 ? `${t.rating.toFixed(1)} (${t.reviewCount})` : 'New'}</td>
                  <td className={dash.num}>{t.bookingsCount}</td>
                  <td className={`${dash.num} ${dash.strong}`}>{inr(t.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
