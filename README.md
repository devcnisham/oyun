# OYUN

Turf booking platform: public booking site, partner (turf owner) dashboard and admin console. Next.js App Router with a Supabase Postgres backend.

**Stack:** Next.js 16 (App Router), React 19, Supabase Postgres, Clerk, Vercel. Tests: Vitest, SQL tests on Postgres, Playwright.

## Run it locally

Needs Node 20.9+.

```bash
npm install
npm run dev          # http://localhost:3000
```

That's all: with no `.env.local` the app stores data in `.data/db.json` (starting with the launch turfs) and uses a built-in dev login secret. To open `/admin` or `/partner` locally, set `ADMIN_EMAIL`/`ADMIN_PASSWORD` and `PARTNER_EMAIL`/`PARTNER_PASSWORD` in `.env.local`. `npm run dev` first runs a quick check and tells you if anything is missing.

- **Test the mobile app view on your phone:** `npm run dev:lan`, then open `http://<your-computer-IP>:3000` on the same Wi-Fi.
- **Use Supabase locally:** copy `.env.example` to `.env.local`, fill in `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY`, and run `supabase/migrations/20261006000000_oyun_store.sql` in the Supabase SQL editor. If the tables are missing, dev falls back to the local file and prints how to fix it.
- **Start local data over:** stop the server and delete `.data/`.
- **Something looks stale after pulling:** `npm install`, delete `.next/`, restart.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `npm run dev:lan` | Dev server (LAN variant for testing on a phone) |
| `npm run typecheck` / `npm run lint` | Type-check and lint (CI allows zero warnings) |
| `npm test` | Unit tests (Vitest) |
| `npm run test:sql` | Database function and race tests (needs Postgres) |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run build` | Production build |

## Deploying (Vercel)

Add every variable from `.env.example` in the Vercel project settings, apply the migration to the Supabase project once, then deploy.

## Launch checklist

See [docs/GO-LIVE.md](docs/GO-LIVE.md) for the steps to take the site live, and [docs/LAUNCH-SEO.md](docs/LAUNCH-SEO.md) for Search Console, analytics, error alerts and the backlink plan.

## How data is stored

`src/lib/store.ts` is the only module that talks to storage. Pages call `await getDb()`; server actions call `await mutate(db => ...)`, which reloads the latest data, runs the change and writes only the rows that changed in one transaction (`apply_changes`). If another write landed in between, it retries on fresh data. Postgres enforces one live booking per turf slot, so two people can never book the same hour.

All tables have row-level security on with no policies: only the server, using the secret key, can read or write them.

## Docs and contributing

- [CONTRIBUTING.md](CONTRIBUTING.md): working agreement, tests, definition of done.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/CODEBASE-MAP.md](docs/CODEBASE-MAP.md): how the code fits together.
- [docs/AUTHORIZATION.md](docs/AUTHORIZATION.md), [docs/SECURITY.md](docs/SECURITY.md): who can do what, and how to report a vulnerability.
- [docs/BRANCHING.md](docs/BRANCHING.md), [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md): branches and environments.
- Found a bug or want a feature? Open an [issue](https://github.com/devcnisham/oyun/issues/new/choose).
