import { dash } from '@/components/dash/ui';
import { launchProblems, realtimeConfigured } from '@/lib/launch-checks';
import { storageInfo } from '@/lib/store';

// Shown on every admin page until production is connected. Not dismissible: fix the setup to clear it.
export default function LaunchBanner() {
  const storage = storageInfo();
  const problems = launchProblems({ storage: storage.backend, shared: storage.shared, realtime: realtimeConfigured() });
  if (problems.length === 0) return null;

  return (
    <div className={dash.card} role="alert" style={{ borderColor: '#dc2626', borderWidth: 2, background: '#fef2f2', marginBottom: 16 }}>
      <h2 className={dash.cardTitle} style={{ color: '#991b1b' }}>⛔ Not ready for live bookings</h2>
      <p className={dash.cardDesc} style={{ color: '#7f1d1d' }}>
        Don&apos;t take real bookings until every item below is fixed. Check <code>/api/health</code> after each redeploy; see docs/GO-LIVE.md.
      </p>
      <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: '#7f1d1d' }}>
        {problems.map((p) => (
          <li key={p.check} style={{ marginTop: 6 }}>
            <strong>{p.title}</strong> <code>({p.check})</code>
            <div>{p.fix}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
