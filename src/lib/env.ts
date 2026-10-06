// Settings with safe defaults for local development (`npm run dev`) and strict ones in production.

const isDev = process.env.NODE_ENV === 'development';

// Signs login cookies. Local dev works without one; production must set SESSION_SECRET.
export function sessionSecret(): string | undefined {
  return process.env.SESSION_SECRET || (isDev ? 'local-dev-only-session-secret-do-not-use-in-production' : undefined);
}

// One-click "See Demo" logins: on by default in local dev, opt-in (DEMO_LOGIN=true) elsewhere.
export function demoLoginEnabled(): boolean {
  if (process.env.DEMO_LOGIN === 'true') return true;
  return isDev && process.env.DEMO_LOGIN !== 'false';
}
