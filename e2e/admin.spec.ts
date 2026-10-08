import { expect, test } from '@playwright/test';
import { acceptDialogs, asPlayer } from './helpers';

test('owner lists a turf, admin approves it and it goes live', async ({ page }) => {
  await asPlayer(page);
  acceptDialogs(page);
  const turfName = `E2E Arena ${Date.now().toString(36)}`;

  await page.goto('/list-turf');
  const form = page.locator('#list-form');
  await form.locator('[name=ownerName]').fill('Owner Test');
  await form.locator('[name=ownerPhone]').fill('9876500005');
  await form.locator('[name=ownerEmail]').fill(`owner-${Date.now()}@example.com`);
  await page.locator('#form-next').click();

  await form.locator('[name=turfName]').fill(turfName);
  await form.locator('[name=area]').selectOption({ index: 1 });
  await form.locator('[name=size]').selectOption({ index: 1 });
  await form.locator('[name=address]').fill('Near the main road, Mangalore 575001');
  await form.locator('[name=surface]').selectOption({ index: 1 });
  await form.locator('[name=openTime]').fill('06:00');
  await form.locator('[name=closeTime]').fill('23:00');
  await page.locator('#form-next').click();

  await form.locator('[name=weekdayPrice]').fill('800');
  await form.locator('[name=eveningPrice]').fill('1000');
  await form.locator('[name=weekendPrice]').fill('1100');
  await page.locator('#form-next').click();

  await form.locator('[name=description]').fill('A floodlit test turf with parking and drinking water.');
  // The form ignores submissions made under 4 seconds after opening it (bot check), so wait like a person would
  await page.waitForTimeout(4500);
  await page.locator('#form-submit').click();
  await expect(page.getByText(/received your listing/)).toBeVisible();

  await page.goto('/admin');
  const card = page.getByText(turfName).locator('xpath=ancestor::*[.//button[normalize-space()="Approve & create partner"]][1]');
  await card.getByRole('button', { name: 'Approve & create partner' }).click();
  await expect(page.getByRole('status').filter({ hasText: /approved|live|partner/i }).first()).toBeVisible();

  // The approved turf is now listed for players
  await page.goto('/arenas');
  await expect(page.getByText(turfName)).toBeVisible();
});
