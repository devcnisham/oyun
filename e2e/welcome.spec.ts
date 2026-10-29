import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([{ name: 'oyun_consent', value: 'essential', domain: 'localhost', path: '/' }]);
});

test('first-visit guide can be skipped, remembered and replayed with keyboard support', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Show me', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Find your venue' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pick your time', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Show me', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'How booking works', exact: true })).toHaveCount(0);
  await page.goto('/?guide=1');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Keep your ticket', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start playing', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('landing introduces the service without replacing the booking home', async ({ page }) => {
  await page.goto('/landing');
  await expect(page.getByRole('heading', { name: 'Less planning. More playing.' })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/landing$/);
  await expect(page.getByText('Launching soon')).toHaveCount(0);
  await page.locator('[data-startup-splash]').waitFor({ state: 'detached' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.screenshot({ path: test.info().outputPath('landing.png') });
  await page.getByRole('link', { name: 'New here? Start here' }).click();
  await expect(page.getByRole('dialog', { name: 'Find your venue' })).toBeVisible();
});

test('owner introduction leads to the working listing form without fabricated statistics', async ({ page }) => {
  await page.goto('/list-turf');
  await expect(page.getByRole('heading', { name: 'Your ground. Their next great game.' })).toBeVisible();
  await page.locator('[data-startup-splash]').waitFor({ state: 'detached' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.screenshot({ path: test.info().outputPath('owner.png') });
  await expect(page.getByText('2,000+')).toHaveCount(0);
  await page.getByRole('link', { name: 'List your venue', exact: true }).first().click();
  await expect(page.getByLabel('Full Name *', { exact: true })).toBeInViewport();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Please check these fields' })).toBeVisible();
  await expect(page.locator('#ownerName')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});


test('brand intro is centred and runs again on a full refresh', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/landing', { waitUntil: 'commit' });
  const splash = page.locator('[data-startup-splash]');
  await expect(splash).toBeVisible();
  await splash.evaluate(el => el.getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = 1500; }));
  await page.screenshot({ path: test.info().outputPath('loader.png') });
  const word = splash.locator('svg');
  const box = await word.boundingBox();
  expect(Math.abs(box!.x + box!.width / 2 - page.viewportSize()!.width / 2)).toBeLessThan(4);
  expect(Math.abs(box!.y + box!.height / 2 - page.viewportSize()!.height / 2)).toBeLessThan(4);
  await expect(splash).toHaveCount(0);
  await page.reload({ waitUntil: 'commit' });
  await expect(splash).toBeVisible();
  await expect(splash).toHaveCount(0);
});

test('first-visit guide does not shift the mobile booking home after hydration', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The mobile layout is also the production Lighthouse performance target.');
  await page.addInitScript(() => {
    const state = window as unknown as Window & { oyunLayoutShift: number };
    state.oyunLayoutShift = 0;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!shift.hadRecentInput) state.oyunLayoutShift += shift.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Show me', exact: true })).toBeVisible();
  await expect(page.locator('[data-startup-splash]')).toHaveCount(0);
  await page.waitForTimeout(750);
  expect(await page.evaluate(() => (window as unknown as Window & { oyunLayoutShift: number }).oyunLayoutShift)).toBeLessThan(.05);
});
