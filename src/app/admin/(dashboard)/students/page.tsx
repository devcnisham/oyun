import ActionForm from '@/components/dash/ActionForm';
import { Badge, PageHeader, dash } from '@/components/dash/ui';
import { reviewStudentId } from '@/lib/admin-actions';
import { platformOffersOf } from '@/lib/platform-offers';
import { STUDENT_ID_PENDING_DAYS } from '@/lib/student-id';
import { getDb } from '@/lib/store';

export default async function AdminStudents() {
  const db = await getDb();
  const offer = platformOffersOf(db.settings).student;
  const pending = db.players.filter((p) => p.student?.status === 'pending').sort((a, b) => a.student!.submittedAt.localeCompare(b.student!.submittedAt));
  const approved = db.players.filter((p) => p.student?.status === 'approved').length;

  return (
    <div className={dash.page}>
      <PageHeader
        title="Student IDs"
        desc={`Players ask for the ${offer.title} (${offer.percentOff}% off) by sending a photo of their student ID at checkout. ${offer.active ? 'The offer is on.' : 'The offer is off: switch it on in Settings first.'}`}
      />

      <div className={dash.card}>
        <div className={dash.cardHeader}>
          <h2 className={dash.cardTitle}>Waiting for review ({pending.length})</h2>
          <Badge status="approved" label={`${approved} approved students`} />
        </div>
        <p className={dash.muted}>Check that the photo shows a current student ID with the same name as the player. The photo is deleted as soon as you decide, and after {STUDENT_ID_PENDING_DAYS} days if nobody reviews it.</p>
        {pending.length === 0 ? (
          <p className={dash.empty}>No student IDs waiting.</p>
        ) : (
          <ul>
            {pending.map((p) => (
              <li key={p.id} style={{ display: 'grid', gap: 12, padding: '16px 0', borderTop: '1px solid var(--border)' }}>
                <div>
                  <b className={dash.strong}>{p.name}</b> <span className={dash.muted}>· {p.phone} · sent {p.student!.submittedAt.slice(0, 10)}</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/admin/student-id/${p.id}`} alt={`Student ID sent by ${p.name}`} style={{ maxWidth: 420, width: '100%', borderRadius: 12, border: '1px solid var(--border)' }} />
                <ActionForm action={reviewStudentId}>
                  <input type="hidden" name="playerId" value={p.id} />
                  <label className={dash.field}>
                    <span className={dash.label}>If you reject it: tell the player why (optional)</span>
                    <input name="note" maxLength={200} className={dash.input} placeholder="For example: the photo is blurry" />
                  </label>
                  <div className={dash.actions}>
                    <button name="decision" value="approve" className={dash.btn}>Approve</button>
                    <button name="decision" value="reject" className={`${dash.btn} ${dash.btnSecondary}`}>Reject</button>
                  </div>
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
