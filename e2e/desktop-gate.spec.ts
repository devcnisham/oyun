// Desktop visitors can enter booking directly, without a bypass cookie or phone handoff.
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([{ name: 'oyun_consent', value: 'essential', domain: 'localhost', path: '/' }]);
});

test('home opens the booking feed directly on every screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Book venues and courts in Mangalore');
  await expect(page.getByRole('search', { name: 'Find a venue' })).toBeVisible();
  await expect(page.getByRole('img', { name: /QR code that opens OYUN on your phone/ })).toHaveCount(0);
  await expect(page.getByRole('img', { name: /OYUN app: browse turfs/ })).toHaveCount(0);
  const venue = page.locator('a[href^="/arenas/"]').first();
  await expect(venue).toBeVisible();
  await venue.click();
  await expect(page).toHaveURL(/\/arenas\/[^/?]+$/);
  await expect(page.locator('[data-desktop-gate]')).toHaveCount(0);
});

test('home search carries its query into venue results', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('search', { name: 'Find a venue' });
  await search.getByRole('searchbox').fill('Kodialbail');
  await search.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page).toHaveURL(/\/arenas\?/);
  const url = new URL(page.url());
  expect(url.searchParams.get('q')).toBe('Kodialbail');
  expect(url.searchParams.has('sport')).toBe(false);
  expect(url.searchParams.has('date')).toBe(false);
});

test('the redesigned home fits the viewport and offers direct daytime browsing', async ({ page, isMobile }) => {
  if (!isMobile) await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const daytime = page.getByRole('region', { name: /Morning and afternoon deals/ });
  await expect(daytime.getByRole('link', { name: /daytime slots/ })).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath(`oyun-redesign-${isMobile ? 'mobile' : 'desktop'}.png`), fullPage: true });
  await page.screenshot({ path: test.info().outputPath(`oyun-redesign-${isMobile ? 'mobile' : 'desktop'}-top.png`) });
});

test('home remains readable at tablet width', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop context can resize to tablet');
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('home metadata and public crawler endpoints are still served', async ({ page, request }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/OYUN.*Book Sports/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Book.*venues/);
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(new URL(canonical!).pathname).toBe('/');
  expect((await request.get('/robots.txt')).status()).toBe(200);
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toContain('/bookings');
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
