// Runs before `npm run dev` and explains common local setup problems in plain words.
import { existsSync, readFileSync } from 'node:fs';

const problems = [];
const notes = [];

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 20 || (major === 20 && minor < 9)) {
  problems.push(`Node ${process.versions.node} is too old. Next.js 16 needs Node 20.9 or newer: https://nodejs.org`);
}

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const missing = Object.keys(pkg.dependencies ?? {}).filter(
  (name) => !existsSync(new URL(`../node_modules/${name}/package.json`, import.meta.url)),
);
if (missing.length) problems.push(`Packages not installed: ${missing.join(', ')}. Run: npm install`);

const envFile = ['.env.local', '.env.development.local', '.env'].find((f) => existsSync(f));
const env = {};
if (envFile) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
const has = (k) => Boolean(process.env[k] || env[k]);

if (has('SUPABASE_SECRET_KEY') && has('NEXT_PUBLIC_SUPABASE_URL')) {
  notes.push('Data: Supabase (if its tables are missing, dev falls back to .data/db.json and prints how to fix it).');
} else {
  notes.push('Data: local file .data/db.json (add SUPABASE_SECRET_KEY to .env.local to use Supabase).');
  notes.push('⚠ Data parity drift: SUPABASE_SECRET_KEY is empty locally. Local dev is using isolated .data/db.json. Writes stay local and will not match Vercel. For local parity, set SUPABASE_SECRET_KEY (or use a separate dev Supabase project).');
}
if (!has('SESSION_SECRET')) notes.push('Logins: using a built-in dev secret (set SESSION_SECRET for production).');
if (!has('ADMIN_EMAIL') || !has('ADMIN_PASSWORD')) notes.push('Admin login: set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local to open /admin.');
if (!has('PARTNER_EMAIL') || !has('PARTNER_PASSWORD')) notes.push('Partner login: set PARTNER_EMAIL and PARTNER_PASSWORD in .env.local to open /partner.');
notes.push('Test on your phone: run `npm run dev:lan` and open http://<your-computer-IP>:3000 on the same Wi-Fi.');

if (problems.length) {
  console.error('\n✖ OYUN can\'t start yet:\n' + problems.map((p) => `  • ${p}`).join('\n') + '\n');
  process.exit(1);
}
console.log('\n✔ OYUN dev setup looks good\n' + notes.map((n) => `  • ${n}`).join('\n') + '\n');
