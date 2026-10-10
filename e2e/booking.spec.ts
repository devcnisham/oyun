import { expect, test } from '@playwright/test';
import { TURF, acceptDialogs, asPlayer, confirmBooking, holdFirstSlot, seats } from './helpers';

test('browse → hold → book → cancel', async ({ page }) => {
  await asPlayer(page);
  acceptDialogs(page);

  await page.goto('/arenas');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // Tomorrow, so the booking is more than 2 hours away and can be cancelled
  expect(await holdFirstSlot(page, 1)).toBe(true);
  const code = await confirmBooking(page);
  expect(code).toMatch(/^SA-/);

  // Anonymous ticket: the booking phone number is the second factor
  await page.getByLabel('Mobile number used for this booking').fill('9876500001');
  await page.getByRole('button', { name: 'Cancel booking' }).click();
  await expect(page.getByRole('button', { name: 'Cancel booking' })).toBeHidden();
  await expect(page.getByText(/cancelled/i).first()).toBeVisible();
});

test('a slot booked by one player shows as booked to another', async ({ browser }) => {
  const a = await browser.newPage();
  await asPlayer(a, 'Player A', '9876500002');
  expect(await holdFirstSlot(a, 2)).toBe(true);
  await confirmBooking(a);

  const b = await browser.newPage();
  await asPlayer(b, 'Player B', '9876500003');
  await b.goto(`/arenas/${TURF}`);
  await b.getByRole('tab').nth(2).click();
  // Player A took the earliest slot of that day, so player B sees it as booked
  const first = seats(b).first();
  await expect(first).toHaveAttribute('aria-disabled', 'true');
  await expect(first).toContainText('Booked');
});
