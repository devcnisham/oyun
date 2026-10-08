import { connection } from 'next/server';
import { clerkEnabled } from '@/lib/clerk';
import { launchProblems, loginChecks, realtimeConfigured } from '@/lib/launch-checks';
import { realtimeBroadcastWorks } from '@/lib/realtime';
import { getDb, storageInfo } from '@/lib/store';

// Launch check: is the site wired up? Reports only yes/no flags, never keys or data.
export async function GET() {
  await connection();
  const storage = storageInfo();
  const logins = loginChecks();
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
    realtimeBroadcast: 'off' as 'ok' | 'failed' | 'off',
    playerSignIn: clerkEnabled ? 'clerk' : 'device',
    ...logins,
  };
  if (checks.realtimeSlotUpdates) checks.realtimeBroadcast = (await realtimeBroadcastWorks()) ? 'ok' : 'failed';
  const problems = launchProblems({
    storage: storage.backend,
    shared: storage.shared,
    realtime: checks.realtimeSlotUpdates,
    realtimeBroadcast: checks.realtimeBroadcast === 'ok',
    ...logins,
  }).map((p) => p.check);
  const ready = database === 'ok' && problems.length === 0;
  return Response.json({ ready, problems, ...checks }, { status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
