import ActionForm from '@/components/dash/ActionForm';
import { Badge, PageHeader, dash, tableScroll } from '@/components/dash/ui';
import Pager from '@/components/dash/Pager';
import Stars from '@/components/Stars';
import { banReviewAuthor, toggleReviewHidden } from '@/lib/admin-actions';
import { paginate } from '@/lib/paginate';
import { turfReviews } from '@/lib/reviews';
import { getDb } from '@/lib/store';
import { formatDateTime } from '@/lib/time';

export default async function AdminReviews({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const db = await getDb();
  const paged = paginate(turfReviews(db, null, { includeHidden: true, limit: Number.MAX_SAFE_INTEGER }), pageParam, 50);
  const reviews = paged.items;
  const turfName = (id: string) => db.turfs.find((t) => t.id === id)?.name ?? id;

  return (
    <div className={dash.page}>
      <PageHeader title="Reviews" desc="Ratings players leave after they play. Hide a review if it is abusive or off-topic; the turf's rating updates at once." />
      <div className={dash.card}>
        {reviews.length === 0 ? (
          <p className={dash.muted}>No reviews yet. Players can rate a turf from their booking after they are checked in.</p>
        ) : (
          <div {...tableScroll}>
            <table className={dash.table}>
              <thead>
                <tr><th>Turf</th><th>Rating</th><th>Review</th><th>Player</th><th>When</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {reviews.map((r) => {
                  const booking = db.bookings.find((b) => b.id === r.bookingId);
                  const player = db.players.find((p) => (booking?.playerId && p.id === booking.playerId) || (booking?.customerPhone && p.phone === booking.customerPhone));
                  const isBanned = player?.status === 'banned';

                  return (
                    <tr key={r.bookingId}>
                      <td className={dash.strong}>{turfName(r.turfId)}</td>
                      <td><Stars value={r.rating} size={14} /></td>
                      <td style={{ maxWidth: 360 }}>{r.comment || <span className={dash.muted}>No comment</span>}</td>
                      <td>
                        {r.name}
                        {isBanned && <span className={`${dash.badge} ${dash.badgeRed}`} style={{ marginLeft: 6 }}>Banned</span>}
                      </td>
                      <td>{formatDateTime(r.createdAt)}</td>
                      <td><Badge status={r.hidden ? 'suspended' : 'active'} label={r.hidden ? 'Hidden' : 'Visible'} /></td>
                      <td>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <ActionForm action={toggleReviewHidden} inline>
                            <input type="hidden" name="bookingId" value={r.bookingId} />
                            <button className={`${dash.btn} ${dash.btnSm} ${dash.btnSecondary}`}>{r.hidden ? 'Show' : 'Hide'}</button>
                          </ActionForm>
                          {!isBanned && (
                            <ActionForm action={banReviewAuthor} inline confirm="Ban this user from future bookings and hide review?">
                              <input type="hidden" name="bookingId" value={r.bookingId} />
                              <button className={`${dash.btn} ${dash.btnSm} ${dash.btnDanger}`}>Ban</button>
                            </ActionForm>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pager info={paged} basePath="/admin/reviews" />
      </div>
    </div>
  );
}
