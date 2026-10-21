// After the staging app has run once (it fills an empty database with the launch turfs), create the relational
// venues, courts and bookables for them, then show the parity report.
//   npm run staging:sync
// Uses .env.staging.local; refuses the production project.
import { existsSync, readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const PRODUCTION_REF = 'duwkypegndkkgfzjgiok';
const file = '.env.staging.local';
if (!existsSync(file)) {
  console.error(`Missing ${file}.`);
  process.exit(2);
}
const env = {};
for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required in .env.staging.local.');
  process.exit(2);
}
if (url.includes(PRODUCTION_REF)) {
  console.error('Refusing: .env.staging.local points at the PRODUCTION Supabase project.');
  process.exit(2);
}

const client = createClient(url, key, { auth: { persistSession: false } });
const synced = await client.rpc('sync_all_turfs_to_venues');
if (synced.error) {
  console.error(`sync_all_turfs_to_venues failed: ${synced.error.message}`);
  process.exit(1);
}
console.log(`Synced ${synced.data} turf(s) into venues, courts and bookables.`);
const parity = await client.rpc('parity_report');
if (parity.error) {
  console.error(`parity_report failed: ${parity.error.message}`);
  process.exit(1);
}
console.log('Parity:', JSON.stringify(parity.data, null, 2));
if (!parity.data.ok) process.exit(1);
