'use client';

import { useState, useTransition } from 'react';
import { dash } from '@/components/dash/ui';
import { approveApplication, rejectApplication } from '@/lib/admin-actions';
import type { ActionResult, Application } from '@/lib/types';

// Approved/rejected items leave this list, so the result (incl. the new partner's
// temporary password) is kept here rather than in each item's form.
export default function PendingApplications({ applications }: { applications: Application[] }) {
  const [result, setResult] = useState<ActionResult>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: typeof approveApplication, fd: FormData) => {
    startTransition(async () => {
      setResult(await action(null, fd));
    });
  };

  return (
    <div className={dash.form}>
      {result?.ok && <p role="status" className={`${dash.message} ${dash.success}`}>{result.ok}</p>}
      {result?.error && <p role="alert" className={`${dash.message} ${dash.error}`}>{result.error}</p>}

      {applications.length === 0 ? (
        <p className={dash.empty}>No applications waiting. 🎉</p>
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
                <form action={(fd) => run(approveApplication, fd)}>
                  <input type="hidden" name="applicationId" value={a.id} />
                  <button className={dash.btn} disabled={pending}>Approve & create partner</button>
                </form>
                <form action={(fd) => run(rejectApplication, fd)} className={dash.inline}>
                  <input type="hidden" name="applicationId" value={a.id} />
                  <input name="note" placeholder="Reason (optional)" className={dash.input} style={{ flex: 1 }} />
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
