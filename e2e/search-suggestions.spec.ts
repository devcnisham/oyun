import { expect, test } from '@playwright/test';
import { asPlayer } from './helpers';

test('search suggests matches and completes the typed word without category badges', async ({ page, isMobile }) => {
  await asPlayer(page);
  for (const path of isMobile ? ['/booking', '/arenas'] : ['/booking']) {
    await page.goto(path);
    const input = page.getByRole('searchbox').first();
    await input.fill('Per');
    const suggestions = page.getByRole('list', { name: 'Search suggestions' });
    await expect(suggestions.getByRole('link', { name: /Perfect Pass/ })).toBeVisible();
    await expect(suggestions.getByText('Venue', { exact: true })).toHaveCount(0);
    await input.press('ArrowDown');
    await expect(suggestions.getByRole('link', { name: /Perfect Pass/ })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(suggestions).toHaveCount(0);
    await input.fill('fu');
    await expect(page.locator('span[class*="ghost"]')).toHaveText('futsal');
    await input.press('Tab');
    await expect(input).toHaveValue('futsal');
    await input.fill('bad');
    await expect(suggestions.locator('a[href="/arenas?sport=Badminton"]')).toBeVisible();
  }
});
