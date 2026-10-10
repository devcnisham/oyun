import ActionForm from '@/components/dash/ActionForm';
import { Badge, PageHeader, dash } from '@/components/dash/ui';
import Stars from '@/components/Stars';
import { toggleReviewHidden } from '@/lib/admin-actions';
import { turfReviews } from '@/lib/reviews';
import { getDb } from '@/lib/store';
import { formatDateTime } from '@/lib/time';

export default async function AdminReviews() {
  const db = await getDb();
  const reviews = turfReviews(db, null, { includeHidden: true, limit: 500 });
  const turfName = (id: string) => db.turfs.find((t) => t.id === id)?.name ?? id;

  return (
    <div className={dash.page}>
      <PageHeader title="Reviews" desc="Ratings players leave after they play. Hide a review if it is abusive or off-topic; the turf's rating updates at once." />
      <div className={dash.card}>
        {reviews.length === 0 ? (
          <p className={dash.muted}>No reviews yet. Players can rate a turf from their booking after they are checked in.</p>
        ) : (
          <div className={dash.tableWrap} tabIndex={0} role="region" aria-label="Table, scrolls sideways">
            <table className={dash.table}>
              <thead>
                <tr><th>Turf</th><th>Rating</th><th>Review</th><th>Player</th><th>When</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.bookingId}>
                    <td className={dash.strong}>{turfName(r.turfId)}</td>
                    <td><Stars value={r.rating} size={14} /></td>
                    <td style={{ maxWidth: 360 }}>{r.comment || <span className={dash.muted}>No comment</span>}</td>
                    <td>{r.name}</td>
                    <td>{formatDateTime(r.createdAt)}</td>
                    <td><Badge status={r.hidden ? 'suspended' : 'active'} label={r.hidden ? 'Hidden' : 'Visible'} /></td>
                    <td>
                      <ActionForm action={toggleReviewHidden} inline>
                        <input type="hidden" name="bookingId" value={r.bookingId} />
                        <button className={`${dash.btn} ${dash.btnSm} ${dash.btnSecondary}`}>{r.hidden ? 'Show' : 'Hide'}</button>
                      </ActionForm>
                    </td>
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
