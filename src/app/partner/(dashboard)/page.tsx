import NavIcon from '@/modules/shared/frontend/dash/NavIcon';
import Link from 'next/link';
import { Badge, inr, tableScroll } from '@/modules/shared/frontend/dash/ui';
import { requirePartner } from '@/modules/shared/backend/partner-auth';
import { bookingRevenue } from '@/modules/shared/lib/reports';
import { getDb } from '@/modules/shared/database/store';
import { addDays, formatDate, formatHour, formatSlotRange, istNow } from '@/modules/shared/lib/time';
import { halfNote, turfHours } from '@/modules/shared/lib/pricing';
import QuickSlotBlocker from '@/modules/partner/frontend/QuickSlotBlocker';
import styles from './PartnerDashboard.module.css';

export default async function PartnerDashboard() {
  const ctx = await requirePartner();
  const db = await getDb();
  const now = istNow();
  const monthPrefix = now.date.slice(0, 7);
  const bookings = db.bookings.filter((b) => b.turfId === ctx.turf.id);

  // Time & Status computations
  const currentHourFormatted = `${String(now.hour).padStart(2, '0')}:${String(now.minute).padStart(2, '0')}`;
  const operatingHours = turfHours(ctx.turf);
  const isFacilityOpen = operatingHours.includes(now.hour);

  const thisMonth = bookings.filter((b) => b.date.startsWith(monthPrefix));
  const revenue = thisMonth.reduce((s, b) => s + bookingRevenue(b), 0);
  const today = bookings
    .filter((b) => b.date === now.date && b.status !== 'cancelled' && b.status !== 'refunded')
    .sort((a, b) => a.hour - b.hour);
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && b.date > now.date && b.date <= addDays(now.date, 7));
  const upcomingRevenue = upcoming.reduce((s, b) => s + bookingRevenue(b), 0);
  
  const pastMonth = bookings.filter((b) => b.date >= addDays(now.date, -30) && b.date < now.date);
  const noShows = pastMonth.filter((b) => b.status === 'no_show').length;
  const attended = pastMonth.filter((b) => b.status === 'checked_in').length;
  const attendanceRate = attended + noShows > 0 ? Math.round((attended / (attended + noShows)) * 100) : 100;

  const todayOccupancy = operatingHours.length > 0 ? Math.min(100, Math.round((today.length / operatingHours.length) * 100)) : 0;

  // 7-day revenue trend
  const days = Array.from({ length: 7 }, (_, i) => addDays(now.date, i - 6));
  const daily = days.map((d) => ({
    date: d,
    value: bookings.filter((b) => b.date === d).reduce((s, b) => s + bookingRevenue(b), 0),
  }));
  const max = Math.max(1, ...daily.map((d) => d.value));
  const weeklyRevenue = daily.reduce((sum, d) => sum + d.value, 0);
  const dailyAverageRevenue = Math.round(weeklyRevenue / 7);

  // Recent bookings and active blocks
  const recent = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 7);
  const activeBlocks = db.blocks
    .filter((b) => b.turfId === ctx.turf.id && b.date >= now.date)
    .sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);

  // Next-Up Booking Spotlight: Next booking happening today at or after current hour
  const nextBooking = today.find((b) => b.hour >= now.hour && b.status === 'confirmed');

  // Greeting based on IST time
  let timeGreeting = 'Good afternoon';
  if (now.hour < 12) timeGreeting = 'Good morning';
  else if (now.hour >= 18) timeGreeting = 'Good evening';

  const partnerFirstName = ctx.userName.split(' ')[0] || 'Partner';

  return (
    <div className={styles.dashboard}>
      {/* 1. Command Bar / Hero Header */}
      <section className={styles.commandHero}>
        <div className={styles.heroLeft}>
          <div className={styles.greetingRow}>
            <h1 className={styles.greetingTitle}>
              {timeGreeting}, {partnerFirstName}
            </h1>
            <div className={`${styles.facilityStatusPill} ${isFacilityOpen ? styles.facilityOpen : styles.facilityClosed}`}>
              {isFacilityOpen && <span className={styles.pulseDot} aria-hidden="true" />}
              <span>{isFacilityOpen ? 'Facility Open · Taking Bookings' : 'Facility Closed for the day'}</span>
            </div>
          </div>
          <p className={styles.heroSubtitle}>
            <span>{ctx.turf.name}</span>
            <span className={styles.heroSubtitleDot}>•</span>
            <span>{ctx.turf.city || ctx.turf.location}</span>
            <span className={styles.heroSubtitleDot}>•</span>
            <span>Current Time: <strong>{currentHourFormatted} IST</strong></span>
          </p>
        </div>

        <div className={styles.heroActions}>
          {ctx.can('bookings') && (
            <Link href="/partner/bookings#walk-in" className={`${styles.actionBtnPrimary} ${styles.btnRed}`}>
              <span>+</span> Walk-in Booking
            </Link>
          )}
          {ctx.can('checkin') && (
            <Link href="/partner/check-in" className={`${styles.actionBtnSecondary} ${styles.btnGreen}`}>
              <NavIcon name="camera" size={16} /> Check-in Desk
            </Link>
          )}
          {ctx.can('slots') && (
            <a href="#block-slot" className={`${styles.actionBtnSecondary} ${styles.btnAmber}`}>
              <NavIcon name="lock" size={16} /> Block Slot
            </a>
          )}
          <Link href={`/arenas/${ctx.turf.id}`} className={`${styles.actionBtnSecondary} ${styles.btnBlue}`}>
            <NavIcon name="external" size={16} /> Public Page
          </Link>
        </div>
      </section>

      {/* 2. "Next Up" Operational Priority Card */}
      {nextBooking && (
        <section className={styles.nextUpCard} aria-label="Next upcoming booking">
          <div className={styles.nextUpLeft}>
            <div className={styles.nextUpBadge}>
              <span className={styles.nextUpBadgeLabel}>NEXT UP</span>
              <span className={styles.nextUpBadgeTime}>{formatHour(nextBooking.hour)}</span>
            </div>
            <div className={styles.nextUpDetails}>
              <div className={styles.nextUpPlayer}>
                <span>{nextBooking.customerName}</span>
                <span className={styles.nextUpCode}>{nextBooking.code}</span>
              </div>
              <div className={styles.nextUpSub}>
                {nextBooking.timeLabel}{halfNote(nextBooking.pitch, ctx.turf.halfNames)} • {nextBooking.customerPhone} • {nextBooking.source === 'walk_in' ? 'Walk-in' : 'Online Booking'}
              </div>
            </div>
          </div>

          {ctx.can('checkin') && (
            <Link
              href={`/partner/check-in?code=${nextBooking.code}`}
              className={styles.nextUpAction}
            >
              <NavIcon name="camera" size={16} /> Check In Player Now
            </Link>
          )}
        </section>
      )}

      {/* 4. KPI Telemetry Metric Grid */}
      <section className={styles.kpiGrid} aria-label="Key Performance Indicators">
        {/* Revenue This Month */}
        {ctx.can('payouts') && (
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Revenue This Month</span>
              <div className={styles.kpiIconBox} title="Monthly revenue"><NavIcon name="payouts" size={18} /></div>
            </div>
            <div className={styles.kpiValue}>{inr(revenue)}</div>
            <div className={styles.kpiFooter}>
              <span>{thisMonth.filter((b) => bookingRevenue(b) > 0).length} paid bookings</span>
              <span className={styles.kpiPillPositive}>+ Active</span>
            </div>
          </div>
        )}

        {/* Today's Bookings & Occupancy */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Today&apos;s Court Occupancy</span>
            <div className={styles.kpiIconBox} title="Occupancy"><NavIcon name="analytics" size={18} /></div>
          </div>
          <div className={styles.kpiValue}>{todayOccupancy}%</div>
          <div className={styles.kpiProgressTrack}>
            <div className={styles.kpiProgressBar} style={{ width: `${todayOccupancy}%` }} />
          </div>
          <div className={styles.kpiFooter}>
            <span>{today.length} of {operatingHours.length} slots booked</span>
            <span style={{ fontWeight: 600 }}>{today.filter((b) => b.status === 'checked_in').length} checked in</span>
          </div>
        </div>

        {/* Next 7 Days Pipeline */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Next 7 Days Pipeline</span>
            <div className={styles.kpiIconBox} title="Upcoming pipeline"><NavIcon name="calendar" size={18} /></div>
          </div>
          <div className={styles.kpiValue}>{upcoming.length} bookings</div>
          <div className={styles.kpiFooter}>
            <span>Pipeline potential</span>
            <strong style={{ color: '#111827' }}>{inr(upcomingRevenue)}</strong>
          </div>
        </div>

        {/* Attendance & No-Show Rate */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Player Attendance Rate</span>
            <div className={styles.kpiIconBox} title="Attendance rate"><NavIcon name="target" size={18} /></div>
          </div>
          <div className={styles.kpiValue}>{attendanceRate}%</div>
          <div className={styles.kpiFooter}>
            <span>30-day history ({noShows} no-shows)</span>
            <span className={attendanceRate >= 90 ? styles.kpiPillPositive : undefined} style={{ fontSize: 11, fontWeight: 700 }}>
              {attendanceRate >= 90 ? 'Healthy' : 'Needs attention'}
            </span>
          </div>
        </div>
      </section>

      {/* 5. Two-Column Operational Layout */}
      <section className={styles.dashboardGrid}>
        {/* Left Column: Revenue Trend & Weekly Analytics */}
        {ctx.can('payouts') ? (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Revenue & Volume (Last 7 Days)</h2>
                <p className={styles.cardSubtitle}>Total earnings across online and walk-in sales</p>
              </div>
              <Link href="/partner/payouts" className={styles.actionBtnSecondary} style={{ padding: '6px 12px', fontSize: 13 }}>
                View Payouts <NavIcon name="external" size={14} />
              </Link>
            </div>

            <div className={styles.chartContainer}>
              <div className={styles.chartStatsSummary}>
                <div className={styles.chartStatCol}>
                  <span className={styles.chartStatLabel}>7-Day Total</span>
                  <span className={styles.chartStatVal}>{inr(weeklyRevenue)}</span>
                </div>
                <div className={styles.chartStatCol}>
                  <span className={styles.chartStatLabel}>Daily Average</span>
                  <span className={styles.chartStatVal}>{inr(dailyAverageRevenue)}</span>
                </div>
                <div className={styles.chartStatCol}>
                  <span className={styles.chartStatLabel}>Peak Day</span>
                  <span className={styles.chartStatVal}>{inr(max)}</span>
                </div>
              </div>

              <div className={styles.chartBarsWrapper}>
                {daily.map((d) => {
                  const isToday = d.date === now.date;
                  const barHeightPercent = max > 0 ? Math.round((d.value / max) * 100) : 0;
                  return (
                    <div key={d.date} className={styles.chartCol}>
                      <span className={styles.chartAmountLabel}>
                        {d.value ? `₹${Math.round(d.value / 1000)}k` : '—'}
                      </span>
                      <div className={styles.chartBarTrack}>
                        <div
                          className={`${styles.chartBarFill} ${isToday ? styles.chartBarFillToday : ''}`}
                          style={{ height: `${Math.max(barHeightPercent, 4)}%` }}
                          title={`${formatDate(d.date)}: ${inr(d.value)}`}
                        />
                      </div>
                      <span className={`${styles.chartDayLabel} ${isToday ? styles.chartDayLabelToday : ''}`}>
                        {formatDate(d.date, { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* Right Column: Today's Full Schedule Feed */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Today&apos;s Bookings Schedule</h2>
              <p className={styles.cardSubtitle}>
                {today.length} total reservations scheduled for today
              </p>
            </div>
            {ctx.can('checkin') && (
              <Link href="/partner/check-in" className={styles.actionBtnSecondary} style={{ padding: '6px 12px', fontSize: 13 }}>
                Check-in Desk
              </Link>
            )}
          </div>

          {today.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}><NavIcon name="bookings" size={32} /></span>
              <p className={styles.emptyText}>No bookings scheduled yet today.</p>
              <p style={{ fontSize: 13 }}>Slots are currently open for walk-in or online bookings.</p>
            </div>
          ) : (
            <div className={styles.scheduleList}>
              {today.map((b) => {
                const isNow = b.hour === now.hour;
                return (
                  <div
                    key={b.id}
                    className={`${styles.scheduleRow} ${isNow ? styles.scheduleRowNow : ''}`}
                  >
                    <div className={styles.scheduleLeft}>
                      <span className={styles.slotTimePill}>
                        {formatSlotRange(b.hour)}
                      </span>
                      <div className={styles.scheduleInfo}>
                        <div className={styles.schedulePlayerName}>
                          <span>{b.customerName}</span>
                          {isNow && <span className={styles.slotNowTag}>LIVE NOW</span>}
                        </div>
                        <div className={styles.scheduleMeta}>
                          {b.source === 'walk_in' ? 'Walk-in' : 'Online'} • {b.code} • {b.customerPhone}
                        </div>
                      </div>
                    </div>

                    <div className={styles.scheduleRight}>
                      <Badge status={b.status} />
                      {b.status === 'confirmed' && ctx.can('checkin') && (
                        <Link
                          href={`/partner/check-in?code=${b.code}`}
                          className={styles.actionBtnSecondary}
                          style={{ padding: '4px 10px', fontSize: 12 }}
                        >
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
      </section>

      {/* 6. Recent Bookings Activity Table */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Recent Activity & Bookings</h2>
            <p className={styles.cardSubtitle}>All incoming online and front-desk reservations</p>
          </div>
          {ctx.can('bookings') && (
            <Link href="/partner/bookings" className={styles.actionBtnSecondary} style={{ padding: '6px 12px', fontSize: 13 }}>
              View All Bookings <NavIcon name="external" size={14} />
            </Link>
          )}
        </div>

        <div {...tableScroll} className={styles.tableContainer}>
          <table className={styles.modernTable}>
            <thead>
              <tr>
                <th>Player / Customer</th>
                <th>Slot Time</th>
                <th>Channel</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((b) => {
                const initials = b.customerName
                  .split(' ')
                  .map((p) => p[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'P';

                return (
                  <tr key={b.id}>
                    <td>
                      <div className={styles.playerCell}>
                        <div className={styles.playerAvatar} aria-hidden="true">
                          {initials}
                        </div>
                        <div>
                          <div className={styles.playerName}>{b.customerName}</div>
                          <div className={styles.playerContact}>{b.customerPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{formatDate(b.date, { month: 'short', day: 'numeric' })}</strong>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {b.timeLabel}{halfNote(b.pitch, ctx.turf.halfNames)}
                      </div>
                    </td>
                    <td>
                      <span className={b.source === 'walk_in' ? styles.sourceBadgeWalkIn : styles.sourceBadgeOnline}>
                        {b.source === 'walk_in' ? 'Walk-in Desk' : 'Online App'}
                      </span>
                    </td>
                    <td>
                      <Badge status={b.status} />
                    </td>
                    <td className={styles.amountCell}>
                      {inr(b.pricing.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. Quick Slot Blocker & Active Block Manager */}
      <section id="block-slot" className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Manual Slot Management & Facility Holds</h2>
            <p className={styles.cardSubtitle}>
              Quickly block slots for offline customer phone bookings, venue maintenance, or weather emergencies
            </p>
          </div>
          <Link href="/partner/slots" className={styles.actionBtnSecondary} style={{ padding: '6px 12px', fontSize: 13 }}>
            Full Slot Calendar Grid <NavIcon name="external" size={14} />
          </Link>
        </div>

        <QuickSlotBlocker
          turfHours={operatingHours}
          minDate={now.date}
          activeBlocks={activeBlocks}
          canManageSlots={ctx.can('slots')}
        />
      </section>
    </div>
  );
}
