import { expect, test } from '@playwright/test';
import { asPlayer, confirmBooking, holdFirstSlot, TURF, selectDay, seats } from './helpers';

test('checkout offers 30% or full payment and restores the chosen plan on refresh', async ({ page }) => {
  await asPlayer(page, 'Payment choice', '9876500881');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await holdFirstSlot(page, 3)).toBe(true);
  let sheet = page.getByRole('dialog', { name: 'Checkout' });
  await expect(sheet.getByRole('radio', { name: /^30% advance/ })).toBeChecked();
  const advance = await sheet.getByRole('radio', { name: /^30% advance/ }).locator('..').boundingBox();
  const full = await sheet.getByRole('radio', { name: /^Full payment/ }).locator('..').boundingBox();
  expect(Math.abs(advance!.y - full!.y)).toBeLessThan(2);
  expect(full!.x).toBeGreaterThan(advance!.x + advance!.width);
  await expect(sheet.getByText('Pay at the venue by cash or UPI. Nothing is charged online.')).toHaveCount(0);
  await sheet.getByRole('radio', { name: /^Full payment/ }).check();
  await expect(sheet.getByText('Full payment at the venue', { exact: true })).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Confirm booking', exact: true })).toBeEnabled();
  await page.reload();
  sheet = page.getByRole('dialog', { name: 'Checkout' });
  await expect(sheet.getByRole('radio', { name: /^Full payment/ })).toBeChecked();
  await expect(sheet.getByText('Full payment at the venue', { exact: true })).toBeVisible();
  const code = await confirmBooking(page);
  expect(code).toMatch(/^SA-/);
  await expect(page.getByRole('link', { name: 'Download QR' })).toBeVisible();
});

test('mobile selection hides navigation and puts booking information inside View details', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout');
  await asPlayer(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/arenas/${TURF}`);
  await selectDay(page, 4);
  await seats(page).and(page.locator('[aria-disabled="false"][aria-pressed="false"]')).first().click();
  const proceed = page.getByRole('button', { name: 'Proceed', exact: true });
  await expect(proceed).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Main', exact: true });
  await expect(nav).toBeHidden();
  const bar = proceed.locator('..');
  const rect = await bar.boundingBox();
  expect(Math.abs(rect!.y + rect!.height - page.viewportSize()!.height)).toBeLessThan(2);
  const details = bar.locator('details');
  await expect(details).not.toHaveAttribute('open', '');
  await details.getByText('View details', { exact: true }).click();
  await expect(details.getByText('Perfect Pass', { exact: true })).toBeVisible();
  await details.getByText('View details', { exact: true }).click();
  await proceed.click();
  await expect(page.getByRole('dialog', { name: 'Checkout' })).toBeVisible();
  await expect(nav).toBeHidden();
  await page.getByRole('button', { name: 'Back to slots', exact: true }).click();
  await seats(page).and(page.locator('[aria-pressed="true"][aria-disabled="false"]')).first().click();
  await expect(nav).toBeVisible();
});

test('online payment preview never creates a paid confirmation', async ({ page }) => {
  await asPlayer(page, 'Preview player', '9876500882');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await holdFirstSlot(page, 2)).toBe(true);
  await page.getByRole('dialog', { name: 'Checkout' }).getByRole('button', { name: 'Confirm booking', exact: true }).click();
  const payment = page.getByRole('dialog', { name: 'Payment methods' });
  await expect(payment.getByRole('radio', { name: /^UPI/ })).toBeChecked();
  await payment.screenshot({ path: test.info().outputPath('payment-screen.png') });
  await payment.getByRole('radio', { name: /^Credit/ }).check();
  await expect(payment.locator('input:not([type="radio"])')).toHaveCount(0);
  await payment.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No payment was collected', exact: true })).toBeVisible();
  expect(new URL(page.url()).pathname).toContain('/arenas/');
  await page.getByRole('button', { name: 'Back to checkout', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Checkout' })).toBeVisible();
});

test('Home header contains only the OYUN brand', async ({ page }) => {
  await page.goto('/');
  const header = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(header.getByRole('link', { name: 'OYUN home' })).toBeVisible();
  await expect(header.getByRole('link')).toHaveCount(1);
  await expect(header.getByRole('button')).toHaveCount(0);
});
