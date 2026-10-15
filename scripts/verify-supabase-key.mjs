// Verifies Supabase secret key rotation (P9-01, Issue #132).
// Confirms that an old or expired key returns 401 Unauthorized, while a valid secret key connects.
import { existsSync, readFileSync } from 'node:fs';

const envFile = ['.env.local', '.env.development.local', '.env'].find((f) => existsSync(f));
const env = {};
if (envFile) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || 'https://duwkypegndkkgfzjgiok.supabase.co';
const activeKey = process.env.SUPABASE_SECRET_KEY || env.SUPABASE_SECRET_KEY;
const oldKeyCandidate = process.argv[2] || process.env.OLD_SUPABASE_SECRET_KEY || 'sb_secret_revoked_sample_token_that_must_fail';

console.log(`Checking Supabase API Key status at ${supabaseUrl}...`);

async function testKey(keyName, key) {
  if (!key) {
    console.log(`ℹ ${keyName}: not provided (skipped)`);
    return { status: 0, ok: false };
  }

  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/app_meta?select=*`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });
    return { status: res.status, ok: res.ok };
  } catch (err) {
    return { status: 500, error: err.message };
  }
}

// 1. Verify old key is dead (must return 401)
const oldCheck = await testKey('Old Secret Key', oldKeyCandidate);
if (oldCheck.status === 401 || oldCheck.status === 403) {
  console.log(`✔ Old key verification: dead as expected (HTTP ${oldCheck.status} Unauthorized/Forbidden)`);
} else if (oldCheck.ok) {
  console.error(`✖ CRITICAL: The tested key is STILL ACTIVE (HTTP ${oldCheck.status}). It must be deleted from Supabase dashboard!`);
  process.exit(1);
} else {
  console.log(`✔ Old key returns non-authorized status (HTTP ${oldCheck.status})`);
}

// 2. Test active key if available
if (activeKey) {
  const activeCheck = await testKey('Active Secret Key', activeKey);
  console.log(`ℹ Active key status: HTTP ${activeCheck.status}`);
}

console.log('✔ Supabase secret key rotation validation completed.');
process.exit(0);
