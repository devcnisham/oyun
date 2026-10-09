import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against `next dev` on a throwaway data folder (DATA_DIR), never against a real database:
// Supabase and Clerk variables are blanked, so bookings live in .e2e-data/ and sign-in uses the device name/phone gate.
// In local dev the admin and partner dashboards skip their login (see devLoginSkipped in src/lib/session.ts).
const PORT = 3210;
const blank = { NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '', SUPABASE_SECRET_KEY: '', NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: '', CLERK_SECRET_KEY: '' };

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts', // compiles every route once before the first test (see the file)
  fullyParallel: false,
  workers: 1, // one shared data folder
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    timezoneId: 'Asia/Kolkata',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `node scripts/e2e-reset.mjs && npx next dev -p ${PORT}`,
    // Not /api/health: it answers 503 in tests because production settings are blank on purpose
    url: `http://localhost:${PORT}/robots.txt`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: { ...blank, DATA_DIR: '.e2e-data', NEXT_TELEMETRY_DISABLED: '1' },
  },
});
