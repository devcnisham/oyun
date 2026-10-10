// Accessibility (task RQ-Q2). axe-core runs on the pages people use most; any critical violation fails the
// run, and so does any serious one. Plus: the booking path can be
// driven with the keyboard alone.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { TURF, asPlayer, seats } from './helpers';

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'welcome landing', path: '/welcome' },
  { name: 'arenas list', path: '/arenas' },
  { name: 'turf page', path: `/arenas/${TURF}` },
  { name: 'faq', path: '/faq' },
  { name: 'list your turf', path: '/list-turf' },
  { name: 'partner dashboard', path: '/partner' },
  { name: 'partner check-in', path: '/partner/check-in' },
  { name: 'partner calendar', path: '/partner/calendar' },
  { name: 'admin dashboard', path: '/admin' },
];

async function scan(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const summary = results.violations.map((v) => `${v.impact ?? 'minor'} ${v.id} (${v.nodes.length}): ${v.help}`);
  return { results, summary };
}

for (const { name, path } of PAGES) {
  test(`axe: ${name} has no critical or serious accessibility violations`, async ({ page }, info) => {
    await asPlayer(page);
    const { results, summary } = await scan(page, path);
    if (summary.length > 0) {
      info.annotations.push({ type: 'axe', description: summary.join('\n') });
      console.log(`axe ${path}\n  ${summary.join('\n  ')}`);
    }
    const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(blocking.map((v) => `${v.id}: ${v.help}`), `critical or serious violations on ${path}`).toEqual([]);
  });
}

test('the booking path works with the keyboard alone', async ({ page }) => {
  await asPlayer(page);
  await page.goto(`/arenas/${TURF}`);
  await page.getByRole('tab').nth(1).click(); // tomorrow
  const open = seats(page).and(page.locator('[aria-disabled="false"][aria-pressed="false"]'));
  await open.first().waitFor({ timeout: 10_000 });

  await open.first().focus();
  await page.keyboard.press('Enter');
  await expect(seats(page).and(page.locator('[aria-pressed="true"]')).first()).toBeVisible();

  const proceed = page.getByRole('button', { name: 'Proceed' });
  await proceed.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Checkout' })).toBeVisible();
});
