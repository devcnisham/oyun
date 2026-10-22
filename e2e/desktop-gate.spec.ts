// Booking lives on the phone: wide windows see a landing page at / and a "scan to open on your phone" screen over the booking pages.
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([{ name: 'oyun_consent', value: 'essential', domain: 'localhost', path: '/' }]);
});

test('a computer sees the landing page with a QR code at /', async ({ page, isMobile }) => {
  test.skip(isMobile, 'wide windows only');
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('img', { name: /QR code that opens OYUN on your phone/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /OYUN app: browse turfs/ })).toBeVisible();
});

test('a computer sees the scan screen over the booking pages, and the page is still served', async ({ page, request, isMobile }) => {
  test.skip(isMobile, 'wide windows only');
  const res = await request.get('/arenas');
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain('Sports Arenas');
  await page.goto('/arenas');
  const gate = page.locator('[data-desktop-gate]');
  await expect(gate).toBeVisible();
  await expect(gate.getByRole('heading', { name: 'Book on your phone' })).toBeVisible();
  await expect(gate.getByRole('img', { name: /opens this page on your phone/ }).locator('svg')).toBeVisible();
  await expect(page.locator('#main')).toHaveAttribute('inert', '');
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
