import Link from 'next/link';
import type { PartnerContext } from '@/lib/partner-auth';
import { turfHours } from '@/lib/pricing';
import { getDb } from '@/lib/store';
import { formatDate, formatHour, istNow } from '@/lib/time';
import styles from './PartnerDashboard.module.css';

// Today's court timeline: one tile per open hour with its booking, block or availability
export default async function CourtTimeline({ ctx }: { ctx: PartnerContext }) {
  const db = await getDb();
  const now = istNow();
  const operatingHours = turfHours(ctx.turf);
  const today = db.bookings
    .filter((b) => b.turfId === ctx.turf.id && b.date === now.date && b.status !== 'cancelled' && b.status !== 'refunded')
    .sort((a, b) => a.hour - b.hour);
  const activeBlocks = db.blocks
    .filter((b) => b.turfId === ctx.turf.id && b.date >= now.date)
    .sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);

  return (
    <section className={styles.timelineSection} aria-label="Today's court timeline">
      <div className={styles.timelineHeader}>
        <div className={styles.timelineTitleGroup}>
          <h2 className={styles.sectionTitle}>Today&apos;s Court Timeline</h2>
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            ({formatDate(now.date, { weekday: 'short', month: 'short', day: 'numeric' })})
          </span>
        </div>

        <div className={styles.timelineLegend}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.dotNow}`} />
            <span>Current Slot</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.dotBooked}`} />
            <span>Booked ({today.filter((b) => b.status === 'confirmed').length})</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.dotCheckedIn}`} />
            <span>Checked in ({today.filter((b) => b.status === 'checked_in').length})</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.dotBlocked}`} />
            <span>Blocked</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.dotAvailable}`} />
            <span>Available</span>
          </div>
        </div>
      </div>

      <div className={styles.timelineTrack}>
        {operatingHours.map((h) => {
          const isNow = h === now.hour;
          const booking = today.find((b) => b.hour === h);
          const block = activeBlocks.find((bl) => bl.date === now.date && bl.hour === h);

          let nodeClass = styles.slotNode;
          if (isNow) nodeClass += ` ${styles.slotNodeNow}`;
          else if (booking?.status === 'checked_in') nodeClass += ` ${styles.slotNodeCheckedIn}`;
          else if (booking) nodeClass += ` ${styles.slotNodeBooked}`;
          else if (block) nodeClass += ` ${styles.slotNodeBlocked}`;

          return (
            <div key={h} className={nodeClass}>
              <div className={styles.slotTimeHeader}>
                <span className={styles.slotHour}>{formatHour(h)}</span>
                {isNow && <span className={styles.slotNowTag}>NOW</span>}
              </div>

              {booking ? (
                <>
                  <span className={styles.slotPlayerName} title={booking.customerName}>
                    {booking.customerName}
                  </span>
                  <span className={styles.slotStatusText}>
                    {booking.status === 'checked_in' ? '✓ Checked in' : `Code: ${booking.code}`}
                  </span>
                  {booking.status === 'confirmed' && ctx.can('checkin') ? (
                    <Link
                      href={`/partner/check-in?code=${booking.code}`}
                      className={`${styles.slotQuickBtn} ${isNow ? styles.slotQuickBtnActive : ''}`}
                    >
                      Check in
                    </Link>
                  ) : (
                    <span style={{ fontSize: 11, color: '#4b5563', fontStyle: 'italic' }}>
                      {booking.status.replace(/_/g, ' ')}
                    </span>
                  )}
                </>
              ) : block ? (
                <>
                  <span className={styles.slotPlayerName} style={{ color: '#b45309' }}>
                    🔒 Blocked
                  </span>
                  <span className={styles.slotStatusText} title={block.reason}>
                    {block.reason}
                  </span>
                </>
              ) : (
                <>
                  <span className={styles.slotPlayerName} style={{ color: '#6b7280', fontWeight: 500 }}>
                    Available
                  </span>
                  <span className={styles.slotStatusText} style={{ color: '#047857' }}>
                    Open for play
                  </span>
                  {ctx.can('bookings') && (
                    <Link href="/partner/bookings#walk-in" className={styles.slotQuickBtn}>
                      + Book
                    </Link>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
