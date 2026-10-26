import { chromium, type FullConfig } from '@playwright/test';
import { PARTNER_TURF, TURF } from './helpers';

// `next dev` compiles each route the first time it is opened, and a slow first compile makes the first
// test's navigation abort (net::ERR_ABORTED). Open every route the tests use once, in a real browser,
// before the first test starts. Best effort: a page that still fails here is left for its own test to report.
const ROUTES = ['/', '/landing', '/about', '/countdown', '/arenas', `/arenas/${TURF}`, `/arenas/${PARTNER_TURF}`, '/bookings', '/list-turf', '/admin', '/partner', '/partner/bookings', '/partner/check-in', '/sports', '/offers', '/events', '/membership', '/arenas?type=court', '/arenas?type=turf'];

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? 'http://localhost:3210';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const route of ROUTES) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await page.goto(new URL(route, baseURL).toString(), { waitUntil: 'load', timeout: 120_000 });
        break;
      } catch (err) {
        if (attempt === 3) console.warn(`warm-up: ${route} did not load (${(err as Error).message.split('\n')[0]})`);
      }
    }
  }
  await browser.close();
}
