import { expect, type Page } from '@playwright/test';

export const TURF = 'perfect-pass-kodialbail';

// Skip the cookie banner and sign in with the device profile (no Clerk in tests)
export async function asPlayer(page: Page, name = 'E2E Player', phone = '9876500001') {
  await page.context().addCookies([{ name: 'oyun_consent', value: 'essential', domain: 'localhost', path: '/' }]);
  await page.addInitScript(([n, p]) => localStorage.setItem('oyun_profile', JSON.stringify({ name: n, phone: p })), [name, phone]);
}

export async function acceptDialogs(page: Page) {
  page.on('dialog', (d) => void d.accept());
}

// Slot buttons in the grid (each has aria-pressed and aria-disabled; the save-turf heart has no aria-disabled)
export const seats = (page: Page) => page.locator('button[aria-pressed][aria-disabled]');

// Picks a date tab (0 = today), selects the first open slot and holds it. Returns false if that day has none left.
export async function holdFirstSlot(page: Page, dayIndex: number) {
  await page.goto(`/arenas/${TURF}`);
  await page.getByRole('tab').nth(dayIndex).click();
  const open = seats(page).and(page.locator('[aria-disabled="false"][aria-pressed="false"]'));
  await expect(page.getByText(/open|Updating/).first()).toBeVisible();
  if ((await open.count()) === 0) return false;
  await open.first().click();
  await page.getByRole('button', { name: 'Proceed' }).click();
  await expect(page.getByRole('dialog', { name: 'Checkout' })).toBeVisible();
  return true;
}

export async function confirmBooking(page: Page) {
  await page.getByRole('dialog', { name: 'Checkout' }).getByRole('button', { name: 'Confirm booking' }).click();
  await page.waitForURL(/\/bookings\/[^/?]+$/);
  const code = (await page.getByText(/^SA-[A-Z0-9]{6}$/).first().textContent())!.trim();
  return code;
}
