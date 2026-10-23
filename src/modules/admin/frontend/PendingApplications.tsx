'use client';

import { useState, useTransition } from 'react';
import { dash } from '@/modules/shared/frontend/dash/ui';
import { approveApplication, rejectApplication } from '@/modules/admin/backend/admin-actions';
import type { ActionResult, Application } from '@/modules/shared/database/types';

// Approved/rejected items leave this list, so the results (incl. each new partner's
// temporary password) are kept here, newest first, rather than in each item's form.
// Each one stays until dismissed, so approving a second turf cannot wipe the first password.
export default function PendingApplications({ applications }: { applications: Application[] }) {
  const [results, setResults] = useState<{ id: number; result: NonNullable<ActionResult> }[]>([]);
  const [pending, startTransition] = useTransition();

  const run = (action: typeof approveApplication, fd: FormData, confirmText: string) => {
    if (!window.confirm(confirmText)) return;
    startTransition(async () => {
      const result = await action(null, fd);
      if (result) setResults((r) => [{ id: Date.now() + r.length, result }, ...r]);
    });
  };

  return (
    <div className={dash.form}>
      {results.map(({ id, result }) => (
        <div key={id} className={dash.inline} style={{ alignItems: 'flex-start' }}>
          {result.ok && <p role="status" className={`${dash.message} ${dash.success}`} style={{ flex: 1 }}>{result.ok}</p>}
          {result.error && <p role="alert" className={`${dash.message} ${dash.error}`} style={{ flex: 1 }}>{result.error}</p>}
          <button type="button" className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`} onClick={() => setResults((r) => r.filter((x) => x.id !== id))}>Dismiss</button>
        </div>
      ))}

      {applications.length === 0 ? (
        <p className={dash.empty}>No applications waiting.</p>
      ) : (
        <div className={dash.list}>
          {applications.map((a) => (
            <div key={a.id} className={dash.listItem} style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 320px' }}>
                <div className={dash.strong}>{a.turfName} <span className={dash.muted}>· {a.area}</span></div>
                <div className={dash.muted}>{a.address}</div>
                <div className={dash.muted}>{a.size} · {a.surface} · {a.openTime}–{a.closeTime} · ₹{a.weekdayPrice}/hr</div>
                <div className={dash.muted}>Owner: {a.ownerName} · {a.ownerPhone} · {a.ownerEmail}</div>
                {a.description && <p className={dash.muted} style={{ marginTop: 6 }}>{a.description}</p>}
              </div>
              <div className={dash.form} style={{ flex: '1 1 260px' }}>
                <form action={(fd) => run(approveApplication, fd, `Approve ${a.turfName}? This creates the owner login and puts the turf live.`)}>
                  <input type="hidden" name="applicationId" value={a.id} />
                  <button className={dash.btn} disabled={pending}>Approve & create partner</button>
                </form>
                <form action={(fd) => run(rejectApplication, fd, `Reject ${a.turfName}? This cannot be undone.`)} className={dash.inline}>
                  <input type="hidden" name="applicationId" value={a.id} />
                  <input name="note" aria-label="Reason (optional)" placeholder="Reason (optional)" className={dash.input} style={{ flex: 1 }} />
                  <button className={`${dash.btn} ${dash.btnDanger}`} disabled={pending}>Reject</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
