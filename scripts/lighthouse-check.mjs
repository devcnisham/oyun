// Lighthouse gate (launch checklist: score >= 90 on home, arenas list and a turf page).
// Usage: node scripts/lighthouse-check.mjs [baseUrl]   (default http://localhost:3000, run against `next start`)
// Env: LH_MIN (default 0.9) minimum score for every category; LH_VERSION pins the Lighthouse CLI.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const min = Number(process.env.LH_MIN ?? 0.9);
const version = process.env.LH_VERSION ?? '12.8.2';
const PAGES = ['/', '/arenas', '/arenas/perfect-pass-kodialbail'];
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

const dir = mkdtempSync(join(tmpdir(), 'lh-'));
let failed = false;
try {
  for (const path of PAGES) {
    const out = join(dir, `${path.replace(/\W+/g, '_') || 'home'}.json`);
    execFileSync(
      'npx',
      [
        '--yes', `lighthouse@${version}`, `${base}${path}`,
        '--output=json', `--output-path=${out}`,
        `--only-categories=${CATEGORIES.join(',')}`,
        '--chrome-flags=--headless=new --no-sandbox',
        '--quiet',
      ],
      { stdio: ['ignore', 'inherit', 'inherit'] }
    );
    const { categories } = JSON.parse(readFileSync(out, 'utf8'));
    const line = CATEGORIES.map((c) => `${c}=${Math.round((categories[c]?.score ?? 0) * 100)}`).join(' ');
    const bad = CATEGORIES.filter((c) => (categories[c]?.score ?? 0) < min);
    console.log(`${bad.length ? 'FAIL' : 'ok  '} ${path}  ${line}`);
    if (bad.length) failed = true;
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
if (failed) {
  console.error(`Lighthouse: a score is below ${Math.round(min * 100)}`);
  process.exit(1);
}
