import { expect, test } from '@playwright/test';
import { PARTNER_TURF, asPlayer, confirmBooking, holdFirstSlot } from './helpers';

test('partner checks in a booking for today by its code', async ({ page }) => {
  // Between 00:00 and 05:30 IST the runner's date (UTC) is a day behind the server's (IST), so "today" in the browser is already past
  const istDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const runnerDate = new Intl.DateTimeFormat('en-CA').format(new Date());
  test.skip(istDate !== runnerDate, 'Runner and venue are on different calendar days');

  await asPlayer(page, 'Walk Up', '9876500004');
  // The dev partner login owns Oyun Club only, so the booking has to be there for the desk to find it
  const hasSlotToday = await holdFirstSlot(page, 0, PARTNER_TURF);
  test.skip(!hasSlotToday, 'No open slot left today (late-night run)');
  const code = await confirmBooking(page);

  await page.goto('/partner/check-in');
  await page.getByPlaceholder(/Booking code/).fill(code);
  await page.locator('button[type=submit]', { hasText: 'Check in' }).click();
  // Desk check-in opens an hour before the slot; the first open slot today may be later than that
  const tooEarly = page.getByText(/opens an hour before/i);
  const cashButton = page.getByRole('button', { name: /Cash collected/ });
  await expect(tooEarly.or(cashButton)).toBeVisible();
  test.skip(await tooEarly.isVisible(), 'First open slot today is more than an hour away');
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

test('partner calendar shows the week and moves between weeks', async ({ page }) => {
  await page.goto('/partner/calendar');
  await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Today' })).toBeVisible();
  await page.getByRole('link', { name: /Next/ }).click();
  await expect(page).toHaveURL(/calendar\?week=\d{4}-\d{2}-\d{2}/);
  await page.getByRole('link', { name: 'This week' }).click();
  await expect(page.getByRole('link', { name: 'Today' })).toBeVisible();
});

test('partner calendar day view opens from a day header and moves between days', async ({ page }) => {
  await page.goto('/partner/calendar');
  await page.getByRole('link', { name: 'Today' }).click();
  await expect(page).toHaveURL(/calendar\?day=\d{4}-\d{2}-\d{2}/);
  await expect(page.getByRole('link', { name: 'Week view' })).toBeVisible();
  await page.getByRole('link', { name: /Next day/ }).click();
  await expect(page).toHaveURL(/calendar\?day=\d{4}-\d{2}-\d{2}/);
  await page.getByRole('link', { name: 'Week view' }).click();
  await expect(page).toHaveURL(/calendar\?week=\d{4}-\d{2}-\d{2}/);
});
