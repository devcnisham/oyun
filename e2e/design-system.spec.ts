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
    await expect(nav.getByRole('link', { name: /^Bookings/ })).toHaveCount(0);
    await expect(nav.getByRole('button', { name: 'Open menu' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'List your venue' })).toHaveCount(0);
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

test('venue results keep only sport categories and can clear incoming search preferences', async ({ page, isMobile }) => {
  await page.goto('/arenas?area=Kodialbail');
  await expect(page.getByRole('button', { name: isMobile ? 'All' : 'All sports', exact: true })).toBeVisible();
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
  await footer.scrollIntoViewIfNeeded();
  await expect.poll(async () => footer.evaluate(el => { const titles = [...el.querySelectorAll('p')]; const top = (label: string) => titles.find(p => p.textContent === label)!.getBoundingClientRect().top; return Math.abs(top('Book') - top('Support')); })).toBeLessThan(2);
  await expect(footer.locator('[aria-hidden="true"]').filter({ hasText: /^OYUN$/ })).toBeVisible();
});

test('redesigned page groups render with no viewport overflow', async ({ page, isMobile }) => {
  test.setTimeout(180_000);
  const paths = ['/blog', '/news', '/sports', '/offers', '/events', '/guides', '/help', '/profile', '/settings', '/saved', '/bookings', '/list-turf', '/about', '/login', `/arenas/${TURF}`, '/partner', '/partner/bookings', '/partner/pricing', '/partner/slots', '/partner/calendar', '/admin', '/admin/turfs', '/admin/users', '/admin/settings'];
  for (const path of paths) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.getByRole('heading', { level: 1 }).first(), path).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
    if (['/partner', '/admin', `/arenas/${TURF}`].includes(path)) {
      await page.screenshot({ path: test.info().outputPath(`oyun-all-pages-${path.replaceAll('/', '-').replace(/^-/, '')}-${isMobile ? 'mobile' : 'desktop'}.png`), fullPage: true });
    }
  }
});


test('home category selection filters featured venues without navigating away', async ({ page }) => {
  await page.goto('/');
  const category = page.getByRole('button', { name: 'Badminton', exact: true });
  await category.click();
  await expect(category).toHaveAttribute('aria-pressed', 'true');
  const featured = page.getByRole('region', { name: 'Badminton featured venues' });
  await expect(featured.getByRole('link', { name: 'Book Smash Court Badminton' })).toBeVisible();
  await expect(featured.getByRole('link', { name: 'Book Perfect Pass' })).toHaveCount(0);
  await expect(featured.getByRole('link', { name: 'See all venues' })).toHaveAttribute('href', '/arenas?sport=Badminton');
  expect(new URL(page.url()).pathname).toBe('/');
  await category.click();
  await expect(category).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('region', { name: 'Featured venues' }).getByRole('link', { name: 'Book Perfect Pass' })).toBeVisible();
});

test('side menu opens, traps focus and closes with Escape', async ({ page, isMobile }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.getByRole('link', { name: /^Bookings/ })).toHaveCount(0);
  const trigger = nav.getByRole('button', { name: 'Open menu' });
  await trigger.click();
  const drawer = page.getByRole('dialog', { name: /^Hey/ });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('link', { name: 'Your bookings', exact: false })).toBeVisible();
  await expect(drawer.getByRole('link', { name: 'Blog', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(trigger).toBeFocused();
  if (isMobile) {
    await expect(nav.getByRole('link', { name: 'Blog', exact: true })).not.toBeVisible();
    const bottom = page.getByRole('navigation', { name: 'Main', exact: true });
    const rect = await bottom.boundingBox();
    const viewport = page.viewportSize()!;
    expect(rect?.x).toBe(0);
    expect(Math.round(rect!.width)).toBe(viewport.width);
    expect(Math.round(rect!.y + rect!.height)).toBe(viewport.height);
  }
});

test('home shows a real live-slot total without duplicate venue cards', async ({ page }) => {
  await page.goto('/');
  const live = page.getByRole('region', { name: 'Live slot availability', exact: true });
  await expect(live.getByText(/\d+ open slots/)).toBeVisible({ timeout: 30_000 });
  await expect(live.locator('article')).toHaveCount(0);
  await expect(live.getByText('TODAY ON OYUN')).toBeVisible();
  await page.getByRole('button', { name: 'Badminton', exact: true }).click();
  await expect(live.getByText(/\d+ open slots/)).toBeVisible({ timeout: 30_000 });
});

test('Google map selects venues and the mobile centre tab opens it', async ({ page, isMobile }) => {
  await page.goto('/arenas?view=map');
  const map = page.getByRole('region', { name: 'Venues on map' });
  await expect(map.locator('iframe')).toHaveAttribute('src', /^https:\/\/www\.google\.com\/maps\/embed/);
  await map.getByRole('button', { name: 'Show Mangala Magnus on Google Maps' }).click();
  await expect(map.locator('iframe')).toHaveAttribute('title', 'Google Maps: Mangala Magnus');
  await map.getByRole('textbox', { name: 'Search map venues' }).fill('Perfect Pass');
  await expect(map.getByRole('button', { name: /Show .* on Google Maps/ })).toHaveCount(1);
  if (isMobile) {
    const nav = page.getByRole('navigation', { name: 'Main', exact: true });
    await expect(nav.getByRole('link').nth(2)).toHaveText('Map');
    await expect(nav.getByRole('link', { name: 'Map', exact: true })).toHaveAttribute('aria-current', 'page');
    await nav.getByRole('link', { name: 'Venues', exact: true }).click();
    await expect(page).toHaveURL(/\/arenas$/);
  }
});
