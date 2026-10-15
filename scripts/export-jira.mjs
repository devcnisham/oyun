// Turns docs/build-tracker.html (tasks and phases) plus the MASTER-PROMPT roadmap into a CSV that Jira can import.
// Usage: node scripts/export-jira.mjs   (writes docs/jira-import.csv). Re-run after the tracker changes.
// See docs/JIRA.md for how to import it and for the browser steps.
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../docs/build-tracker.html', import.meta.url), 'utf8');
const match = html.match(/<script>([\s\S]*)<\/script>/);
const els = {};
const element = () => ({ innerHTML: '', textContent: '', value: '', style: {}, classList: { toggle() {} }, addEventListener() {}, setAttribute() {}, dataset: {}, checked: false });
const sandbox = {
  console: { log() {}, error() {} },
  document: { querySelector: (s) => (els[s] ??= element()), querySelectorAll: () => [] },
  window: { addEventListener() {}, scrollTo() {} },
  location: { hash: '' },
  history: { replaceState() {} },
  localStorage: { getItem: () => null, setItem() {} },
};
vm.runInNewContext(`${match[1]}\n;globalThis.__out = { DATA };`, sandbox);
const { DATA } = sandbox.__out;

// Roadmap items from docs/MASTER-PROMPT.md that are not tracker tasks. s = status when exported.
const ROADMAP = [
  ['RQ-DB', 'Slot booking database v2', [
    ['R007', 'Multi-court venues in the booking flow', 'P1'],
    ['R009', 'Any slot length and after-midnight slots', 'P2'],
    ['R008', 'Retire the jsonb store for bookings, holds, blocks and pricing', 'P1'],
    ['R010', 'One order per checkout (one code, one invoice, one cancel)', 'P2'],
    ['RQ-DB1', 'Turn supabase/proposals/slot_booking_v2.sql into real migrations and setup steps', 'P1'],
    ['RQ-DB2', 'Map every turf to venue, resources and bookables; partner screens for courts', 'P1'],
    ['RQ-DB3', 'Switch slot reads and writes over to the v2 functions', 'P1'],
    ['RQ-DB4', 'Move partners, staff, players, reviews, promos, add-ons and settings off jsonb', 'P2'],
  ]],
  ['RQ-PAY', 'Payments and money', [
    ['R014', 'Razorpay online advance with signed webhook', 'P0'],
    ['R013', 'Wallet as a ledger that can never go below zero', 'P1'],
    ['R012', 'Promo codes: expiry, max uses, per-player limit', 'P1'],
    ['RQ-PAY1', 'Refunds by per-venue cancellation policy, audit-logged', 'P1'],
    ['RQ-PAY2', 'Partner payouts, settlement export, gap-free GST invoice numbers', 'P1'],
    ['RQ-PAY3', 'Daily reconciliation job: payments vs bookings vs payouts', 'P1'],
  ]],
  ['RQ-SEC', 'Security hardening pass', [
    ['R011', 'Persistent rate limits in Postgres', 'P1'],
    ['RQ-SEC1', 'Authorization audit table: every server action and API route, who may call it, and its test', 'P0'],
    ['RQ-SEC2', 'Partner tenant isolation tests', 'P0'],
    ['RQ-SEC3', 'Sessions: rotation, idle and absolute expiry, optional admin TOTP', 'P1'],
    ['RQ-SEC4', 'Bot protection on signup, list-your-turf and hold endpoints', 'P2'],
    ['RQ-SEC5', 'DPDP: export and delete my data, retention purge, notice matches reality', 'P1'],
    ['RQ-SEC6', 'docs/SECURITY.md and backup restore runbook', 'P2'],
  ]],
  ['RQ-FEAT', 'Booking features for players and owners', [
    ['RQ-F1', 'Booking confirmation and 2-hour reminder (WhatsApp or SMS)', 'P1'],
    ['RQ-F2', 'Search filters: price, date and time, amenities; map view', 'P2'],
    ['RQ-F3', 'Partner calendar: day and week across all courts', 'P2'],
    ['RQ-F4', 'Recurring weekly bookings with a conflict check', 'P3'],
    ['RQ-F5', 'Waitlist for full slots', 'P3'],
    ['RQ-F6', 'Split payment link for teammates', 'P3'],
    ['RQ-F7', 'Find players / open matches', 'P3'],
  ]],
  ['RQ-QA', 'Quality before launch', [
    ['RQ-Q1', 'Concurrency test in CI: two clients, one slot, exactly one wins', 'P0'],
    ['RQ-Q2', 'Accessibility: axe with zero critical issues, keyboard path through booking', 'P2'],
    ['RQ-Q3', 'Lighthouse 90+ on home, arenas, turf pages; k6 load test', 'P2'],
    ['RQ-Q4', 'Bad-path tests: payment failure, late webhook, hold expiry, after midnight, half vs full pitch', 'P1'],
  ]],
  ['RQ-LAUNCH', 'Launch and growth', [
    ['RQ-L1', 'SEO landing pages per city, area and sport; Search Console', 'P2'],
    ['RQ-L2', 'Uptime checks and a double-booking dashboard (must be 0)', 'P1'],
    ['RQ-L3', 'Go-live checklist, rollback steps, on-call contacts', 'P1'],
  ]],
];

const PRIORITY = { P0: 'Highest', P1: 'High', P2: 'Medium', P3: 'Low' };
const STATUS = { todo: 'To Do', doing: 'In Progress', blocked: 'Blocked', done: 'Done' };
const q = (v) => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, '\n')}"`;

const rows = [];
let n = 0;
const epics = new Map();
const addEpic = (key, name, desc, status = 'To Do') => {
  const id = ++n;
  epics.set(key, id);
  rows.push({ id, type: 'Epic', summary: name, desc, prio: 'Medium', status, labels: ['oyun', 'epic'], parent: '' });
};

for (const p of DATA.phases) {
  const tasks = DATA.tasks.filter((t) => t.p === p.id);
  const allDone = tasks.length > 0 && tasks.every((t) => t.s === 'done');
  addEpic(p.id, `${p.id} ${p.name}`, `${p.goal}\n\nExit: ${p.exit}${p.refs ? `\nCommits: ${p.refs}` : ''}`, allDone ? 'Done' : 'To Do');
}
for (const [key, name] of ROADMAP) addEpic(key, name, `Roadmap epic from docs/MASTER-PROMPT.md. Tracker tasks in the same area carry their own P-codes.`);

for (const t of DATA.tasks) {
  rows.push({
    id: ++n, type: 'Task', summary: `[${t.id}] ${t.t}`,
    desc: `${t.n ?? ''}\n\nTracker id: ${t.id}. Source of truth: docs/build-tracker.html in the repo.`.trim(),
    prio: PRIORITY[t.pr], status: STATUS[t.s], labels: ['oyun', t.p.toLowerCase(), 'tracker'], parent: epics.get(t.p),
  });
}
for (const [key, , items] of ROADMAP) {
  for (const [id, title, pr] of items) {
    rows.push({
      id: ++n, type: 'Task', summary: `[${id}] ${title}`,
      desc: `Roadmap item from docs/MASTER-PROMPT.md and docs/TASK-WORKFLOW.md.\n\nRoadmap id: ${id}.`,
      prio: PRIORITY[pr], status: 'To Do', labels: ['oyun', 'roadmap'], parent: epics.get(key),
    });
  }
}

// Two Labels columns: Jira maps repeated columns of the same name onto one multi-value field
const head = ['Issue Id', 'Issue Type', 'Summary', 'Description', 'Priority', 'Status', 'Labels', 'Labels', 'Labels', 'Parent'];
const lines = [head.map(q).join(',')];
for (const r of rows) {
  const l = [...r.labels, '', '', ''].slice(0, 3);
  lines.push([r.id, r.type, r.summary, r.desc, r.prio, r.status, ...l, r.parent].map(q).join(','));
}
writeFileSync(new URL('../docs/jira-import.csv', import.meta.url), lines.join('\n') + '\n');
const tasks = rows.filter((r) => r.type === 'Task');
console.log(`${rows.length - tasks.length} epics, ${tasks.length} tasks (${tasks.filter((r) => r.status === 'Done').length} done) written to docs/jira-import.csv`);
