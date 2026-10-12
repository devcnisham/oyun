import { expect, test } from '@playwright/test';
import { TURF, acceptDialogs, asPlayer, confirmBooking, holdFirstSlot, holdSlot, seatAt, selectDay } from './helpers';

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
  const label = await holdSlot(a, 2);
  expect(label).not.toBeNull();
  await confirmBooking(a);

  const b = await browser.newPage();
  await asPlayer(b, 'Player B', '9876500003');
  await b.goto(`/arenas/${TURF}`);
  await selectDay(b, 2);
  // Player B sees the exact slot player A took as booked
  const taken = seatAt(b, label!);
  await expect(taken).toHaveAttribute('aria-disabled', 'true');
  await expect(taken).toContainText('Booked');
});
