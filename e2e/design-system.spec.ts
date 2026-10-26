import { expect, test } from '@playwright/test';
import { asPlayer, TURF } from './helpers';

test.beforeEach(async ({ page }) => {
  await asPlayer(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('desktop navigation is fixed flush to the viewport with no redundant search', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop navigation');
  for (const path of ['/', '/arenas']) {
    await page.goto(path);
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('search')).toHaveCount(0);
    await expect(nav.getByRole('link', { name: /^Bookings/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'List your turf' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Offers', exact: true })).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, 600));
    const box = await nav.boundingBox();
    expect(box?.x).toBe(0);
    expect(box?.y).toBe(0);
    expect(Math.round(box!.width)).toBe(page.viewportSize()!.width);
    expect(await nav.evaluate(el => getComputedStyle(el).position)).toBe('fixed');
  }
});

test('venue cards align their actions while keeping names close to the city', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop context covers the full sizing matrix');
  for (const width of [320, 390, 820, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/arenas');
    await page.locator('article h3').first().waitFor();
    const cards = await page.locator('article').filter({ has: page.getByRole('link', { name: /^Book / }) }).evaluateAll(els => els.map(el => {
      const title = el.querySelector('h3')!;
      const city = title.nextElementSibling!;
      const link = el.querySelector('a')!;
      const action = [...link.querySelectorAll('span')].find(span => span.textContent?.startsWith('Book now'))!;
      const rect = el.getBoundingClientRect();
      return { top: Math.round(rect.top), bottom: rect.bottom, cityGap: city.getBoundingClientRect().top - title.getBoundingClientRect().bottom, city: city.textContent, actionBottom: action.getBoundingClientRect().bottom, actionHeight: action.getBoundingClientRect().height };
    }));
    expect(cards.length).toBeGreaterThan(1);
    for (const card of cards) {
      expect(card.city).toBe('Mangalore');
      expect(card.cityGap).toBeLessThanOrEqual(8);
      expect(card.actionHeight).toBeGreaterThanOrEqual(44);
      for (const peer of cards.filter(other => other.top === card.top)) {
        expect(Math.abs(card.actionBottom - peer.actionBottom)).toBeLessThan(2);
        expect(Math.abs(card.bottom - peer.bottom)).toBeLessThan(2);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('venue results keep only sport categories and can clear incoming search preferences', async ({ page }) => {
  await page.goto('/arenas?area=Kodialbail');
  await expect(page.getByRole('button', { name: 'All sports', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Morning', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Maximum price per hour')).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear search preferences' }).click();
  await expect(page).not.toHaveURL(/[?&]area=/);
});

test('desktop footer keeps Support beside the other groups and shows the dimmed wordmark', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop footer columns');
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/');
  const footer = page.locator('footer');
  const book = await footer.getByText('Book', { exact: true }).boundingBox();
  const support = await footer.getByText('Support', { exact: true }).boundingBox();
  expect(Math.abs(book!.y - support!.y)).toBeLessThan(2);
  await expect(footer.locator('[aria-hidden="true"]').filter({ hasText: /^OYUN$/ })).toBeVisible();
});

test('redesigned page groups render with no viewport overflow', async ({ page, isMobile }) => {
  test.setTimeout(180_000);
  const paths = ['/sports', '/offers', '/events', '/guides', '/help', '/profile', '/settings', '/saved', '/bookings', '/list-turf', '/about', '/login', `/arenas/${TURF}`, '/partner', '/partner/bookings', '/partner/pricing', '/partner/slots', '/partner/calendar', '/admin', '/admin/turfs', '/admin/users', '/admin/settings'];
  for (const path of paths) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.getByRole('heading', { level: 1 }).first(), path).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
    if (['/partner', '/admin', `/arenas/${TURF}`].includes(path)) {
      await page.screenshot({ path: `/private/tmp/oyun-all-pages-${path.replaceAll('/', '-').replace(/^-/, '')}-${isMobile ? 'mobile' : 'desktop'}.png`, fullPage: true });
    }
  }
});
