// Checks docs/build-tracker.html after an edit: the script parses, the page renders against a stub DOM,
// ids are unique, and counts are printed so a change is easy to confirm.
// Usage: node scripts/check-tracker.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const file = new URL('../docs/build-tracker.html', import.meta.url);
const html = readFileSync(file, 'utf8');
const match = html.match(/<script>([\s\S]*)<\/script>/);
if (!match) {
  console.error('FAIL no <script> block found');
  process.exit(1);
}

const els = {};
const values = { '#feat-aud': 'All' };
const element = (key) => ({
  innerHTML: '',
  textContent: '',
  get value() {
    return values[key] ?? '';
  },
  style: {},
  classList: { toggle() {} },
  addEventListener() {},
  setAttribute() {},
  dataset: {},
  checked: false,
});
const sandbox = {
  console,
  document: { querySelector: (s) => (els[s] ??= element(s)), querySelectorAll: () => [] },
  window: { addEventListener() {}, scrollTo() {} },
  location: { hash: '' },
  history: { replaceState() {} },
  localStorage: { getItem: () => null, setItem() {} },
};

try {
  // Run the page script, then read its top-level data back out
  const script = `${match[1]}\n;globalThis.__out = { DATA, D2 };`;
  vm.runInNewContext(script, sandbox, { filename: 'build-tracker.html' });
} catch (err) {
  console.error('FAIL page script threw:', err.message);
  process.exit(1);
}

const { DATA, D2 } = sandbox.__out;
let failed = 0;
const check = (ok, label) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed++;
};

const dupes = (ids) => ids.filter((id, i) => ids.indexOf(id) !== i);
const taskIds = DATA.tasks.map((t) => t.id);
const phaseIds = new Set(DATA.phases.map((p) => p.id));
check(dupes(taskIds).length === 0, `task ids are unique${dupes(taskIds).length ? ': ' + [...new Set(dupes(taskIds))].join(', ') : ''}`);
check(DATA.tasks.every((t) => phaseIds.has(t.p)), 'every task belongs to a known phase');
check(DATA.tasks.every((t) => ['todo', 'doing', 'blocked', 'done'].includes(t.s)), 'task statuses are todo, doing, blocked or done');
check(DATA.tasks.every((t) => ['P0', 'P1', 'P2', 'P3'].includes(t.pr)), 'task priorities are P0 to P3');
const riskIds = DATA.risks.map((r) => r.id);
check(dupes(riskIds).length === 0, 'risk ids are unique');
const taskSet = new Set(taskIds);
check(DATA.risks.every((r) => taskSet.has(r.task)), 'every risk points to an existing task');
const statuses = new Set(['built', 'partial', 'planned', 'removed']);
check(D2.featureGroups.every((g) => g.subs.every((x) => statuses.has(x[1]))), 'feature statuses are built, partial, planned or removed');
check(els['#feat-table']?.innerHTML.length > 1000, 'Features tab rendered');
check(els['#calc-out']?.innerHTML.length > 500, 'cost calculator rendered');

const done = DATA.tasks.filter((t) => t.s === 'done').length;
const parts = D2.featureGroups.reduce((n, g) => n + g.subs.length, 0);
console.log(`\n${DATA.tasks.length} tasks (${done} done), ${DATA.risks.length} risks, ${D2.featureGroups.length} features with ${parts} parts, ${DATA.adr.length} decisions`);
const header = html.match(/Updated after [^<·]*/)?.[0]?.trim();
console.log(`Header note: ${header ?? 'not found'}`);
console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
