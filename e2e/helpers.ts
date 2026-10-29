import { expect, type Page } from '@playwright/test';

export const TURF = 'perfect-pass-kodialbail';
// The turf owned by the dev partner login (the OYUN operations account): partner dashboard tests must book here
export const PARTNER_TURF = 'oyun-club-test';

// Skip the cookie banner and sign in with the device profile (no Clerk in tests)
export async function asPlayer(page: Page, name = 'E2E Player', phone = '9876500001') {
  await page.context().addCookies([
    { name: 'oyun_consent', value: 'essential', domain: 'localhost', path: '/' },
  ]);
  await page.addInitScript(([n, p]) => localStorage.setItem('oyun_profile', JSON.stringify({ name: n, phone: p })), [name, phone]);
}

export async function acceptDialogs(page: Page) {
  page.on('dialog', (d) => void d.accept());
}

// Slot buttons in the grid (each has aria-pressed and aria-disabled; the save-turf heart has no aria-disabled)
export const seats = (page: Page) => page.locator('button[aria-pressed][aria-disabled]');

// Opens a date tab (0 = today) and waits until that day's slots have replaced the previous day's.
// The grid keeps showing the old day until the new slots arrive, so a click or a read made too early
// lands on the wrong day's slots.
export async function selectDay(page: Page, dayIndex: number) {
  const tab = page.getByRole('tab').nth(dayIndex);
  // A click before the page hydrates does nothing, so repeat it until the tab is selected (clicking a selected tab is a no-op)
  await expect(async () => {
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 1_000 });
  }).toPass();
  // "Updating…" shows from the click until the new slots are in place
  await expect(page.getByText('Updating…')).toBeHidden();
  await expect(page.getByText(/\d+ open/)).toBeVisible();
}

// The slot button for a time label such as "06:00 AM" (its title starts with the label whether the slot is open or taken)
export const seatAt = (page: Page, label: string) => seats(page).and(page.locator(`[title^="${label} "]`));

// Picks a date tab, selects the first open slot and holds it. Returns the slot's time label (e.g. "06:00 AM"),
// or null if that day has none left.
export async function holdSlot(page: Page, dayIndex: number, turf: string = TURF) {
  await page.goto(`/arenas/${turf}`);
  await selectDay(page, dayIndex);
  const open = seats(page).and(page.locator('[aria-disabled="false"][aria-pressed="false"]'));
  if ((await open.count()) === 0) return null;
  const label = (await open.first().getAttribute('title'))!.split(' · ')[0];
  await open.first().click();
  await page.getByRole('button', { name: 'Proceed' }).click();
  await expect(page.getByRole('dialog', { name: 'Checkout' })).toBeVisible();
  return label;
}

// Same, for callers that only need to know whether a slot was held. Returns false if that day has none left.
export async function holdFirstSlot(page: Page, dayIndex: number, turf: string = TURF) {
  return (await holdSlot(page, dayIndex, turf)) !== null;
}

export async function confirmBooking(page: Page) {
  await page.getByRole('dialog', { name: 'Checkout' }).getByRole('button', { name: 'Confirm booking' }).click();
  const payment = page.getByRole('dialog', { name: 'Payment methods' });
  await expect(payment).toBeVisible();
  await payment.getByRole('radio', { name: /^Pay at venue/ }).check();
  await payment.getByRole('button', { name: 'Confirm reservation', exact: true }).click();
  await page.waitForURL(/\/bookings\/[^/?]+$/);
  const code = (await page.getByText(/^SA-[A-Z0-9]{6}$/).first().textContent())!.trim();
  return code;
}
