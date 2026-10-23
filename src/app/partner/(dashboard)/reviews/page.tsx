import { PageHeader, Stat, dash, tableScroll } from '@/modules/shared/frontend/dash/ui';
import Stars from '@/modules/shared/frontend/Stars';
import { requirePartner } from '@/modules/shared/backend/partner-auth';
import { turfReviews } from '@/modules/shared/lib/reviews';
import { getDb } from '@/modules/shared/database/store';
import { formatDateTime } from '@/modules/shared/lib/time';

export default async function PartnerReviews() {
  const ctx = await requirePartner();
  const db = await getDb();
  const turf = db.turfs.find((t) => t.id === ctx.turf.id) ?? ctx.turf;
  const reviews = turfReviews(db, turf.id, { limit: 200 });

  return (
    <div className={dash.page}>
      <PageHeader title="Reviews" desc="What players say after they play at your turf. Ratings appear on your turf page." />
      <div className={dash.stats}>
        <Stat label="Average rating" value={turf.reviewCount ? `${turf.rating.toFixed(1)} / 5` : '—'} />
        <Stat label="Ratings" value={turf.reviewCount} />
      </div>
      <div className={dash.card}>
        {reviews.length === 0 ? (
          <p className={dash.muted}>No reviews yet. Players are asked to rate the turf on their booking after you check them in.</p>
        ) : (
          <div {...tableScroll}>
            <table className={dash.table}>
              <thead><tr><th>Rating</th><th>Review</th><th>Player</th><th>When</th></tr></thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.bookingId}>
                    <td><Stars value={r.rating} size={14} /></td>
                    <td style={{ maxWidth: 420 }}>{r.comment || <span className={dash.muted}>No comment</span>}</td>
                    <td>{r.name}</td>
                    <td>{formatDateTime(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
