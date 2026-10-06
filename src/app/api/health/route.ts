import { connection } from 'next/server';
import { clerkEnabled } from '@/lib/clerk';
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
    realtimeSlotUpdates: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && process.env.SUPABASE_SECRET_KEY),
    playerSignIn: clerkEnabled ? 'clerk' : 'device',
    adminLogin: Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.SESSION_SECRET),
    partnerLogin: Boolean(process.env.PARTNER_EMAIL && process.env.PARTNER_PASSWORD && process.env.SESSION_SECRET),
  };
  const ready = database === 'ok' && storage.shared && checks.adminLogin;
  return Response.json({ ready, ...checks }, { status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
