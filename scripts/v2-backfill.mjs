// Copies existing bookings into the oyun schema and checks the copy (v2 integration, phase 5).
//   node scripts/v2-backfill.mjs            dry run: does everything, rolls it back, prints the report
//   node scripts/v2-backfill.mjs --apply    really copies (repeatable: rows already copied are skipped)
//   node scripts/v2-backfill.mjs --parity   only compares public.bookings with oyun
// Uses NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY from the environment or .env.local.
// Run it on staging first. See docs/V2-CUTOVER.md.
import { existsSync, readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.');
  process.exit(2);
}
const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const client = createClient(url, key, { auth: { persistSession: false } });

async function call(fn, params) {
  const { data, error } = await client.rpc(fn, params);
  if (error) {
    console.error(`${fn} failed: ${error.message}`);
    process.exit(1);
  }
  return data;
}

if (!args.has('--parity')) {
  const report = await call('backfill_legacy_bookings', { p_dry_run: !apply });
  console.log(JSON.stringify(report, null, 2));
  const problems = report.noVenue.length + report.noBookable.length + report.noSlots.length + report.errors.length;
  console.log(`\n${apply ? 'Copied' : 'Would copy'} ${report.inserted} booking(s); ${report.alreadyThere} already there; ${problems} that cannot be copied; ${report.claimConflicts.length} overlapping live booking(s) kept without a slot claim.`);
  if (!apply) console.log('Dry run: nothing was written. Re-run with --apply when the report looks right.');
}

if (apply || args.has('--parity')) {
  const parity = await call('parity_report', {});
  console.log('\nParity:', JSON.stringify(parity, null, 2));
  process.exit(parity.ok ? 0 : 1);
}
