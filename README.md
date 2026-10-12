# OYUN

Turf booking platform: public booking site, partner (turf owner) dashboard and admin console. Next.js App Router with a Supabase Postgres backend.

## Run it locally

Needs Node 20.9+.

```bash
npm install
npm run dev          # http://localhost:3000
```

That's all: with no `.env.local` the app stores data in `.data/db.json` (starting with the launch turfs) and uses a built-in dev login secret. To open `/admin` or `/partner` locally, set `ADMIN_EMAIL`/`ADMIN_PASSWORD` and `PARTNER_EMAIL`/`PARTNER_PASSWORD` in `.env.local`. `npm run dev` first runs a quick check and tells you if anything is missing.

- **Test the mobile app view on your phone:** `npm run dev:lan`, then open `http://<your-computer-IP>:3000` on the same Wi-Fi.
- **Use Supabase locally:** copy `.env.example` to `.env.local`, fill in `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY`, and run `supabase/migrations/20261006000000_oyun_store.sql` in the Supabase SQL editor. If the tables are missing, dev falls back to the local file and prints how to fix it.
- **Sign-in with Clerk (optional):** set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`. Without them players use a device name-and-phone fallback.
- **Start local data over:** stop the server and delete `.data/`.
- **Something looks stale after pulling:** `npm install`, delete `.next/`, restart.

## Checks and tests

```bash
npm run lint         # ESLint
npm test             # unit tests (Vitest)
npm run test:e2e     # Playwright end-to-end: booking, partner and admin flows
npm run test:sql     # database tests against the Supabase migrations
npm run build        # production build
```

CI runs these on every pull request, plus `npm audit`. Dependabot opens dependency updates weekly (TypeScript and ESLint majors are skipped until the toolchain supports them).

## Deploying (Vercel)

Add every variable from `.env.example` in the Vercel project settings, apply the migration to the Supabase project once, then deploy.

## Launch checklist

See [docs/GO-LIVE.md](docs/GO-LIVE.md) for the steps to take the site live, and [docs/LAUNCH-SEO.md](docs/LAUNCH-SEO.md) for Search Console, analytics, error alerts and the backlink plan.

## More docs

- [FEATURE_LIST.md](FEATURE_LIST.md): what is built, partly built and still to do.
- [docs/TASK-WORKFLOW.md](docs/TASK-WORKFLOW.md): ordered task queue and how to pick up the next task.
- [docs/SLOT-BOOKING-DB.md](docs/SLOT-BOOKING-DB.md): slot booking and double-booking guard design.
- [docs/NEXT16-NOTES.md](docs/NEXT16-NOTES.md): Next.js 16 conventions used in this repo.
- [docs/JIRA.md](docs/JIRA.md): Jira setup and CSV export.

## How data is stored

`src/lib/store.ts` is the only module that talks to storage. Pages call `await getDb()`; server actions call `await mutate(db => ...)`, which reloads the latest data, runs the change and writes only the rows that changed in one transaction (`apply_changes`). If another write landed in between, it retries on fresh data. Postgres enforces one live booking per turf slot, so two people can never book the same hour.

All tables have row-level security on with no policies: only the server, using the secret key, can read or write them.
