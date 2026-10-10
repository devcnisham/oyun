import { expect, test } from '@playwright/test';
import { asPlayer, confirmBooking, holdFirstSlot } from './helpers';

test('partner checks in a booking for today by its code', async ({ page }) => {
  await asPlayer(page, 'Walk Up', '9876500004');
  const hasSlotToday = await holdFirstSlot(page, 0);
  test.skip(!hasSlotToday, 'No open slot left today (late-night run)');
  const code = await confirmBooking(page);

  await page.goto('/partner/check-in');
  await page.getByPlaceholder(/Booking code/).fill(code);
  await page.locator('button[type=submit]', { hasText: 'Check in' }).click();
  // The player owes the balance at the venue, so the desk must confirm it took the cash first
  await page.getByRole('button', { name: /Cash collected/ }).click();
  await expect(page.getByText(/checked in for/i)).toBeVisible();

  // A second check-in of the same code is refused (the box clears itself after a successful check-in)
  const box = page.getByPlaceholder(/Booking code/);
  await expect(box).toHaveValue('');
  await box.fill(code);
  await page.locator('button[type=submit]', { hasText: 'Check in' }).click();
  await expect(page.getByText(/already checked in/i)).toBeVisible();
});
