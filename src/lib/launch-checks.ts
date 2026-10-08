// Production go-live checks shared by /api/health and the admin dashboard banner.
// Pure (no imports) so it can be unit-tested without Next.js. Reports names only, never values.

export type LaunchCheckInput = {
  storage: 'supabase' | 'local-file';
  shared: boolean;
  realtime: boolean;
};

export type LaunchProblem = {
  check: 'storage' | 'bookingsSharedBetweenPlayers' | 'realtimeSlotUpdates';
  title: string;
  fix: string;
};

type Env = Record<string, string | undefined>;

// Realtime needs the public URL and key in the browser and the secret key on the server to broadcast
export function realtimeConfigured(env: Env = process.env): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && env.SUPABASE_SECRET_KEY);
}

export function launchProblems(input: LaunchCheckInput): LaunchProblem[] {
  const problems: LaunchProblem[] = [];
  if (input.storage !== 'supabase') {
    problems.push({
      check: 'storage',
      title: 'Bookings are not stored in Supabase',
      fix: 'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in Vercel, run the SQL in supabase/migrations, then redeploy.',
    });
  }
  if (!input.shared) {
    problems.push({
      check: 'bookingsSharedBetweenPlayers',
      title: 'Players cannot see each other’s holds and bookings',
      fix: 'Each server keeps its own temporary copy, so bookings can disappear and slots can be double-booked. Connect Supabase (above).',
    });
  }
  if (!input.realtime) {
    problems.push({
      check: 'realtimeSlotUpdates',
      title: 'Live slot updates are off',
      fix: 'Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY in Vercel, then redeploy.',
    });
  }
  return problems;
}
