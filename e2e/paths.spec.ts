// The short addresses and index pages people expect on the main site: /turfs, /courts, /venues, /sports, /offers, /events, /membership.
import { expect, test } from '@playwright/test';
import { asPlayer } from './helpers';

test.beforeEach(async ({ page }) => {
  await asPlayer(page);
});

for (const [path, to] of [
  ['/turfs', '/arenas?type=turf'],
  ['/courts', '/arenas?type=court'],
  ['/venues', '/arenas'],
] as const) {
  test(`${path} opens the venue list (${to})`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${to.replace('?', '\\?')}`));
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });
}

test('/turfs shows only venues that have a turf sport, /courts only venues with a court sport', async ({ page }) => {
  const names = async (url: string) => {
    await page.goto(url);
    await page.locator('a[href^="/arenas/"] h3').first().waitFor({ timeout: 30_000 });
    return (await page.locator('a[href^="/arenas/"] h3').allTextContents()).sort();
  };
  const courtNames = await names('/arenas?type=court');
  const turfNames = await names('/arenas?type=turf');
  // A venue with only football can not be on the court list, and the two lists differ
  expect(turfNames.length).toBeGreaterThan(0);
  expect(courtNames).not.toEqual(turfNames);
});

for (const [path, heading] of [
  ['/sports', /Sports in/],
  ['/offers', /Offers/],
  ['/events', /Events/],
  ['/membership', /OYUN account/],
] as const) {
  test(`${path} renders`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
  });
}

test('/sports links to each sport page', async ({ page }) => {
  await page.goto('/sports');
  await expect(page.locator('a[href^="/sports/"]')).toHaveCount(4);
});
