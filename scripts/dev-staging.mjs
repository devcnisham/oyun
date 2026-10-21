// Runs the app against the staging Supabase project with relational slots on.
//   cp .env.staging.example .env.staging.local   (then fill in the secret)
//   npm run dev:staging
// Refuses to start if the settings point at the production project.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const PRODUCTION_REF = 'duwkypegndkkgfzjgiok';
const file = '.env.staging.local';

if (!existsSync(file)) {
  console.error(`Missing ${file}. Copy .env.staging.example to ${file} and add the staging secret key.`);
  process.exit(2);
}

const env = {};
for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const url = env.NEXT_PUBLIC_SUPABASE_URL ?? '';
if (!url) {
  console.error('NEXT_PUBLIC_SUPABASE_URL is empty in .env.staging.local.');
  process.exit(2);
}
if (url.includes(PRODUCTION_REF)) {
  console.error('Refusing to start: .env.staging.local points at the PRODUCTION Supabase project.');
  process.exit(2);
}
if (!env.SUPABASE_SECRET_KEY) {
  console.error('SUPABASE_SECRET_KEY is empty in .env.staging.local (Supabase -> oyun-staging -> Project Settings -> API Keys).');
  process.exit(2);
}

const port = process.env.PORT ?? '3001';
console.log(`Staging app on http://localhost:${port} using ${url} (relational slots ${env.OYUN_V2_SLOTS === '1' ? 'on' : 'OFF'})`);
// Values set here win over any .env.local, so a stray production key there cannot leak in
const child = spawn('npx', ['next', 'dev', '-p', port], { stdio: 'inherit', env: { ...process.env, ...env } });
child.on('exit', (code) => process.exit(code ?? 0));
