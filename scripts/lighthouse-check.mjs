// Lighthouse gate (launch checklist: score >= 90 on home, arenas list and a turf page).
// Usage: node scripts/lighthouse-check.mjs [baseUrl]   (default http://localhost:3000, run against `next start`)
// Env: LH_MIN (default 0.9) minimum score for every category; LH_MIN_PERFORMANCE, LH_MIN_ACCESSIBILITY,
// LH_MIN_BEST_PRACTICES, LH_MIN_SEO override it per category; LH_VERSION pins the Lighthouse CLI.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const defaultMin = Number(process.env.LH_MIN ?? 0.9);
const version = process.env.LH_VERSION ?? '12.8.2';
const PAGES = ['/', '/arenas', '/arenas/perfect-pass-kodialbail'];
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const minFor = (c) => Number(process.env[`LH_MIN_${c.replace(/-/g, '_').toUpperCase()}`] ?? defaultMin);

const dir = mkdtempSync(join(tmpdir(), 'lh-'));
let failed = false;
try {
  // Warm every page first so the first Lighthouse run does not measure a cold server
  for (const path of PAGES) await fetch(`${base}${path}`).then((r) => r.arrayBuffer()).catch(() => {});
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
    const { categories, audits } = JSON.parse(readFileSync(out, 'utf8'));
    // What to fix: metrics, the LCP element and every performance audit that did not pass
    const metric = (id) => audits[id]?.displayValue ?? 'n/a';
    console.log(`  LCP ${metric('largest-contentful-paint')} FCP ${metric('first-contentful-paint')} TBT ${metric('total-blocking-time')} CLS ${metric('cumulative-layout-shift')} SI ${metric('speed-index')}`);
    const lcpEl = audits['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet;
    if (lcpEl) console.log(`  LCP element: ${lcpEl.slice(0, 160)}`);
    const boot = audits['bootup-time']?.details?.items ?? [];
    // What is inside the heaviest script chunk (a name hash tells nothing)
    const top = boot.find((b) => /\.js(\?|$)/.test(String(b.url)) && b.scripting > 300);
    if (top) {
      const text = await fetch(top.url).then((r) => r.text()).catch(() => '');
      const marks = ['framer-motion', 'clerk', 'supabase', 'react-dom', 'qrcode', 'googletagmanager', 'vercel'].filter((m) => text.toLowerCase().includes(m));
      console.log(`  heaviest chunk ${String(top.url).split('/').pop()}: ${Math.round(text.length / 1024)} KiB, mentions: ${marks.join(', ') || 'none of the usual suspects'}`);
    }
    for (const b of boot.slice(0, 5)) console.log(`  script ${Math.round(b.total)} ms (scripting ${Math.round(b.scripting)} ms): ${String(b.url).slice(0, 100)}`);
    for (const ref of categories.performance?.auditRefs ?? []) {
      const a = audits[ref.id];
      if (!a || a.score === null || a.score >= 0.9 || ref.group === 'metrics') continue;
      const saved = a.details?.overallSavingsMs ? ` (saves ~${Math.round(a.details.overallSavingsMs)} ms)` : '';
      console.log(`  - ${a.title}${a.displayValue ? `: ${a.displayValue}` : ''}${saved}`);
      for (const item of (a.details?.items ?? []).slice(0, 4)) console.log(`      ${String(item.url ?? item.node?.snippet ?? item.label ?? '').slice(0, 140)}`);
    }
    const line = CATEGORIES.map((c) => `${c}=${Math.round((categories[c]?.score ?? 0) * 100)}`).join(' ');
    const bad = CATEGORIES.filter((c) => (categories[c]?.score ?? 0) < minFor(c));
    console.log(`${bad.length ? 'FAIL' : 'ok  '} ${path}  ${line}`);
    if (bad.length) failed = true;
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
if (failed) {
  console.error(`Lighthouse: a score is below its minimum (${CATEGORIES.map((c) => `${c} ${Math.round(minFor(c) * 100)}`).join(', ')})`);
  process.exit(1);
}
