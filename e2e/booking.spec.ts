import { expect, test } from '@playwright/test';
import { TURF, acceptDialogs, asPlayer, confirmBooking, holdFirstSlot, holdSlot, seatAt, selectDay } from './helpers';

test('browse → hold → book → downloadable ticket', async ({ page }) => {
  await asPlayer(page);
  acceptDialogs(page);

  await page.goto('/arenas');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // Tomorrow, so the booking is more than 2 hours away and can be cancelled
  expect(await holdFirstSlot(page, 1)).toBe(true);
  const code = await confirmBooking(page);
  expect(code).toMatch(/^SA-/);

  await expect(page.getByRole('link', { name: 'Download QR' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View invoice' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel booking' })).toHaveCount(0);
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

test('booking ticket tools remain usable at tablet and phone widths', async ({ page, isMobile }) => {
  await asPlayer(page, 'Ticket layout player', '9876500078');
  acceptDialogs(page);
  expect(await holdFirstSlot(page, 3)).toBe(true);
  await confirmBooking(page);
  await page.screenshot({ path: test.info().outputPath(`oyun-ticket-${isMobile ? 'mobile' : 'desktop'}.png`), fullPage: true });
  for (const width of isMobile ? [320, 393] : [700, 393]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('link', { name: 'Download QR' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View invoice' })).toBeVisible();
  }
  const download = page.getByRole('link', { name: 'Download QR' });
  await expect(download).toHaveAttribute('href', /^data:image\/png;base64,/);
  await expect(download).toHaveAttribute('download', /^OYUN-SA-/);
  await expect(page.getByRole('button', { name: /Split cost|Reschedule|Cancel booking/ })).toHaveCount(0);
  await page.getByRole('link', { name: 'View invoice' }).click();
  await expect(page.getByRole('heading', { name: /Tax Invoice|Booking Receipt/ })).toBeVisible();
});
