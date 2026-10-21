import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../docs/build-tracker.html', import.meta.url), 'utf8');
const match = html.match(/<script>([\s\S]*)<\/script>/);
const els = {};
const element = () => ({
  innerHTML: '',
  textContent: '',
  value: '',
  style: {},
  classList: { toggle() {} },
  addEventListener() {},
  setAttribute() {},
  dataset: {},
  checked: false,
});
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
const open = DATA.tasks.filter((t) => t.s !== 'done');
const by = {};
for (const t of open) by[t.s] = (by[t.s] || 0) + 1;
console.log(JSON.stringify({ total: DATA.tasks.length, open: open.length, by }, null, 2));
for (const t of open) {
  console.log(`${t.s}\t${t.pr}\t${t.id}\t${t.t}`);
}
