import { connection } from 'next/server';
import { clerkEnabled } from '@/lib/clerk';
import { launchProblems, realtimeConfigured } from '@/lib/launch-checks';
import { getDb, storageInfo } from '@/lib/store';

// Launch check: is the site wired up? Reports only yes/no flags, never keys or data.
export async function GET() {
  await connection();
  const storage = storageInfo();
  let database: 'ok' | 'error' = 'ok';
  let turfs = 0;
  try {
    turfs = (await getDb()).turfs.length;
  } catch {
    database = 'error';
  }
  const checks = {
    storage: storage.backend,
    bookingsSharedBetweenPlayers: storage.shared,
    database,
    turfs,
    realtimeSlotUpdates: realtimeConfigured(),
    playerSignIn: clerkEnabled ? 'clerk' : 'device',
    adminLogin: Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.SESSION_SECRET),
    partnerLogin: Boolean(process.env.PARTNER_EMAIL && process.env.PARTNER_PASSWORD && process.env.SESSION_SECRET),
  };
  const problems = launchProblems({ storage: storage.backend, shared: storage.shared, realtime: checks.realtimeSlotUpdates }).map((p) => p.check);
  const ready = database === 'ok' && checks.adminLogin && problems.length === 0;
  return Response.json({ ready, problems, ...checks }, { status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
