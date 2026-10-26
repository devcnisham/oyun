import { expect, test, type Page } from '@playwright/test';
import { TURF, asPlayer, seats, selectDay } from './helpers';

// A visitor with no account (no Clerk keys in tests, so the device sign-in form is used)
async function asVisitor(page: Page) {
  await page.context().addCookies([
    { name: 'oyun_consent', value: 'essential', domain: 'localhost', path: '/' },
  ]);
}

const openSlots = (page: Page) => seats(page).and(page.locator('[aria-disabled="false"][aria-pressed="false"]'));

test('a new visitor opening the booking site sees log in / sign up with a close button, then the venues', async ({ page }) => {
  await asVisitor(page);
  await page.goto('/arenas');
  const dialog = page.getByRole('dialog', { name: /Sign in to book/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('tab', { name: 'Sign in' })).toBeVisible();
  await expect(dialog.getByRole('tab', { name: 'Create account' })).toBeVisible();

  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // Closing it keeps it away for the rest of the visit
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('dialog', { name: /Sign in to book/i })).toBeHidden();
});

test('signing in from the opening prompt leaves the player on the booking site', async ({ page }) => {
  await asVisitor(page);
  await page.goto('/arenas');
  const dialog = page.getByRole('dialog', { name: /Sign in to book/i });
  await dialog.getByLabel('Mobile number').fill('9876500044');
  await dialog.getByRole('button', { name: 'Continue' }).click();
  await dialog.getByLabel(/Your name/).fill('Entry Player');
  await dialog.getByRole('button', { name: 'Continue' }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/arenas$/);
});

test('without an account, Proceed asks to sign in before the checkout step, then continues', async ({ page }) => {
  await asVisitor(page);
  await page.addInitScript(() => sessionStorage.setItem('oyun_entry_prompt', '1'));
  await page.goto(`/arenas/${TURF}`);
  await selectDay(page, 1);
  await openSlots(page).first().click();
  await page.getByRole('button', { name: 'Proceed' }).click();

  const gate = page.getByRole('dialog', { name: /Sign in to book/i });
  await expect(gate).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Checkout' })).toBeHidden();

  await gate.getByLabel('Mobile number').fill('9876500045');
  await gate.getByRole('button', { name: 'Continue' }).click();
  await gate.getByLabel(/Your name/).fill('Gate Player');
  await gate.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('dialog', { name: 'Checkout' })).toBeVisible();
});

test('a refresh keeps the picked slot, and keeps the held slot in checkout', async ({ page }) => {
  await asPlayer(page, 'Refresh Player', '9876500046');
  await page.goto(`/arenas/${TURF}`);
  await selectDay(page, 2);
  const open = openSlots(page);
  const title = (await open.first().getAttribute('title'))!;
  await open.first().click();

  await page.reload();
  await expect(page.getByText(/\d+ open/)).toBeVisible();
  const same = seats(page).and(page.locator(`[title="${title}"]`));
  await expect(same).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Proceed' }).click();
  await expect(page.getByRole('dialog', { name: 'Checkout' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Checkout' })).toBeVisible();
});
