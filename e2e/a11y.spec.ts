// Accessibility (task RQ-Q2). axe-core runs on the pages people use most; any critical violation fails the
// run, and so does any serious one. Plus: the booking path can be
// driven with the keyboard alone.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { TURF, PARTNER_TURF, asPlayer, seats, holdFirstSlot, confirmBooking } from './helpers';

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'landing page', path: '/landing' },
  { name: 'launch countdown', path: '/countdown' },
  { name: 'about', path: '/about' },
  { name: 'blog', path: '/blog' },
  { name: 'news', path: '/news' },
  { name: 'sports index', path: '/sports' },
  { name: 'offers', path: '/offers' },
  { name: 'events', path: '/events' },
  { name: 'account', path: '/membership' },
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
  // Entrance animations leave text half transparent for a moment, which axe reads as a contrast failure; scan the settled page
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {}))
    )
  );
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const summary = results.violations.flatMap((v) => [
    `${v.impact ?? 'minor'} ${v.id} (${v.nodes.length}): ${v.help}`,
    // Which elements, so a CI log is enough to fix it
    ...v.nodes.slice(0, 5).map((n) => `    ${n.target.join(' ')} :: ${(n.any[0]?.message ?? n.failureSummary ?? '').split('\n')[0].slice(0, 160)}`),
  ]);
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

  // A key press before the page hydrates does nothing, so repeat until the slot is selected (never toggling it off)
  const selected = seats(page).and(page.locator('[aria-pressed="true"]')).first();
  await expect(async () => {
    if (!(await selected.isVisible())) {
      await open.first().focus();
      await page.keyboard.press('Enter');
    }
    await expect(selected).toBeVisible({ timeout: 1_500 });
  }).toPass({ timeout: 15_000 });

  const proceed = page.getByRole('button', { name: 'Proceed' });
  const dialog = page.getByRole('dialog', { name: 'Checkout' });
  await expect(async () => {
    if (!(await dialog.isVisible())) {
      await proceed.focus();
      await page.keyboard.press('Enter');
    }
    await expect(dialog).toBeVisible({ timeout: 1_500 });
  }).toPass({ timeout: 15_000 });
});


test('partner upcoming-booking card meets contrast requirements', async ({ page }) => {
  await asPlayer(page, 'Contrast Player', '9876500091');
  test.skip(!await holdFirstSlot(page, 0, PARTNER_TURF), 'No remaining slot in the venue day');
  await confirmBooking(page);
  const { results, summary } = await scan(page, '/partner');
  await expect(page.getByRole('region', { name: 'Next upcoming booking' })).toBeVisible();
  const contrast = results.violations.filter(v => v.id === 'color-contrast');
  expect(contrast, summary.join('\n')).toEqual([]);
});
