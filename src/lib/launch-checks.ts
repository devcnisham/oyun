// Production go-live checks shared by /api/health and the admin dashboard banner.
// Pure (no imports) so it can be unit-tested without Next.js. Reports names only, never values.

export type LaunchCheckInput = {
  storage: 'supabase' | 'local-file';
  shared: boolean;
  realtime: boolean;
  // Result of a live broadcast from the server; only checked when realtime is configured
  realtimeBroadcast: boolean;
} & LoginChecks;

export type LoginChecks = {
  adminLogin: boolean;
  partnerLogin: boolean;
  sessionSecretStrong: boolean;
  loginPasswordsStrong: boolean;
};

export type LaunchProblem = {
  check:
    | 'storage'
    | 'bookingsSharedBetweenPlayers'
    | 'realtimeSlotUpdates'
    | 'realtimeBroadcast'
    | 'adminLogin'
    | 'sessionSecretStrong'
    | 'loginPasswordsStrong';
  title: string;
  fix: string;
};

type Env = Record<string, string | undefined>;

// Realtime needs the public URL and key in the browser and the secret key on the server to broadcast
export function realtimeConfigured(env: Env = process.env): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && env.SUPABASE_SECRET_KEY);
}

export const MIN_SESSION_SECRET_LENGTH = 32;
export const MIN_LOGIN_PASSWORD_LENGTH = 12;

// Admin login: ADMIN_EMAIL + ADMIN_PASSWORD. OYUN operations partner login (optional): PARTNER_EMAIL + PARTNER_PASSWORD.
// Both sign their cookies with SESSION_SECRET. Turf owners and staff log in with accounts stored in the database.
export function loginChecks(env: Env = process.env): LoginChecks {
  const secret = env.SESSION_SECRET ?? '';
  const adminLogin = Boolean(env.ADMIN_EMAIL && env.ADMIN_PASSWORD && secret);
  const partnerLogin = Boolean(env.PARTNER_EMAIL && env.PARTNER_PASSWORD && secret);
  const strong = (password: string | undefined) => !password || password.length >= MIN_LOGIN_PASSWORD_LENGTH;
  return {
    adminLogin,
    partnerLogin,
    sessionSecretStrong: secret.length >= MIN_SESSION_SECRET_LENGTH,
    loginPasswordsStrong: strong(env.ADMIN_PASSWORD) && strong(env.PARTNER_PASSWORD),
  };
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
  if (input.realtime && !input.realtimeBroadcast) {
    problems.push({
      check: 'realtimeBroadcast',
      title: 'Live slot updates are configured but the server cannot send them',
      fix: 'Check SUPABASE_SECRET_KEY is the current secret key for this project and NEXT_PUBLIC_SUPABASE_URL is right, then redeploy. Server logs show the status code.',
    });
  }
  if (!input.adminLogin) {
    problems.push({
      check: 'adminLogin',
      title: 'Admin login is not set up',
      fix: 'Set ADMIN_EMAIL, ADMIN_PASSWORD and SESSION_SECRET in Vercel (Production), then redeploy.',
    });
  }
  if (!input.sessionSecretStrong) {
    problems.push({
      check: 'sessionSecretStrong',
      title: 'Login cookies are not safely signed',
      fix: `SESSION_SECRET must be random text of at least ${MIN_SESSION_SECRET_LENGTH} characters. Changing it signs everyone out.`,
    });
  }
  if (!input.loginPasswordsStrong) {
    problems.push({
      check: 'loginPasswordsStrong',
      title: 'Admin or operations password is too short',
      fix: `ADMIN_PASSWORD and PARTNER_PASSWORD must be at least ${MIN_LOGIN_PASSWORD_LENGTH} characters.`,
    });
  }
  return problems;
}
