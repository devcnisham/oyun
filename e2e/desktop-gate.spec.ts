// Desktop visitors can enter booking directly, without a bypass cookie or phone handoff.
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([{ name: 'oyun_consent', value: 'essential', domain: 'localhost', path: '/' }]);
});

test('home opens the booking feed directly on every screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('tab', { name: /Turfs/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /QR code that opens OYUN on your phone/ })).toHaveCount(0);
  await expect(page.getByRole('img', { name: /OYUN app: browse turfs/ })).toHaveCount(0);
  const venue = page.locator('a[href^="/arenas/"]').first();
  await expect(venue).toBeVisible();
  await venue.click();
  await expect(page).toHaveURL(/\/arenas\/[^/?]+$/);
  await expect(page.locator('[data-desktop-gate]')).toHaveCount(0);
});

test('a computer can access booking pages without a phone handoff', async ({ page, request, isMobile }) => {
  test.skip(isMobile, 'wide windows only');
  const res = await request.get('/arenas');
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain('Sports Arenas');
  for (const path of ['/arenas', '/arenas/perfect-pass-kodialbail', '/bookings', '/saved', '/profile', '/settings']) {
    await page.goto(path);
    await expect(page.locator('[data-desktop-gate]')).toHaveCount(0);
    await expect(page.locator('#main')).not.toHaveAttribute('inert', '');
    await expect(page.locator('#main')).not.toHaveAttribute('aria-hidden', 'true');
  }
});

test('the scan screen skips the content pages and owner pages', async ({ page, isMobile }) => {
  test.skip(isMobile, 'wide windows only');
  for (const path of ['/faq', '/guides', '/list-turf']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.locator('[data-desktop-gate]')).toHaveCount(0);
  }
});

test('phones never see the scan screen', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone only');
  await page.goto('/arenas');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[data-desktop-gate]')).toBeHidden();
  await expect(page.locator('#main')).not.toHaveAttribute('inert', '');
});
