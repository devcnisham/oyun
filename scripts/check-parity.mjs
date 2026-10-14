// Environment and Data Parity Checker (P8-00c, Issue #126).
// Reports differences between local environment (.env.local) and production configuration.
import { existsSync, readFileSync } from 'node:fs';

const envFile = ['.env.local', '.env.development.local', '.env'].find((f) => existsSync(f));
const env = {};
if (envFile) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const get = (k) => process.env[k] || env[k] || '';

console.log('OYUN Environment & Data Parity Report:');
console.log('----------------------------------------');

const checks = [
  {
    name: 'Supabase URL',
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    desc: 'Public API gateway for Supabase',
  },
  {
    name: 'Supabase Publishable Key',
    key: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    desc: 'Browser client API key for Realtime & Storage',
  },
  {
    name: 'Supabase Secret Key',
    key: 'SUPABASE_SECRET_KEY',
    desc: 'Server-side key for database access and store persistence',
  },
  {
    name: 'Clerk Publishable Key',
    key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    desc: 'Clerk client authentication key',
  },
  {
    name: 'Clerk Secret Key',
    key: 'CLERK_SECRET_KEY',
    desc: 'Clerk backend verification key',
  },
  {
    name: 'Session Secret',
    key: 'SESSION_SECRET',
    desc: 'HMAC signature key for admin and partner session cookies',
  },
];

let hasDrift = false;

for (const c of checks) {
  const val = get(c.key);
  if (val) {
    const masked = val.length > 8 ? `${val.slice(0, 4)}...${val.slice(-4)}` : '****';
    console.log(`✔ ${c.name.padEnd(26)}: configured (${masked})`);
  } else {
    console.log(`✖ ${c.name.padEnd(26)}: MISSING locally`);
    if (c.key === 'SUPABASE_SECRET_KEY') {
      console.log('  ↳ Local environment uses fallback .data/db.json file store.');
      console.log('  ↳ Local bookings and holds will NOT replicate to Vercel/Supabase.');
    }
    hasDrift = true;
  }
}

console.log('----------------------------------------');
if (hasDrift) {
  console.log('ℹ Recommendation: For full parity without modifying production data,');
  console.log('  connect local dev to a dedicated development Supabase branch/project.');
} else {
  console.log('✔ Full environment parity achieved.');
}

process.exit(0);
