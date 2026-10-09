# Environments and settings

| Environment | Where | Data and keys | Who sees it |
| --- | --- | --- | --- |
| Local | `npm run dev` on your machine | A file in `.data/` unless Supabase keys are set; Clerk off unless keys are set; admin and partner logins skipped | Developers |
| Preview | Vercel builds every pull request | Should use a separate staging Supabase project (not set up yet, task P8-12) | Reviewers |
| Production | Vercel deploys `main` | Production Supabase, Clerk live keys | Customers |

Never point local or preview at the production database with the secret key unless you mean to change real data.

## Variables (names only; values live in Vercel and `.env.local`, never in git)

| Variable | Used for | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser Realtime key | public by design |
| `SUPABASE_SECRET_KEY` | Server database and broadcast key; without it storage falls back to `.data/db.json` | **secret** |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Player sign-in (optional) | public / **secret** |
| `SESSION_SECRET` | Signs admin and partner cookies; 32 random bytes | **secret** |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | The admin login; use a long random password | **secret** |
| `PARTNER_EMAIL` / `PARTNER_PASSWORD` | The OYUN Operations partner login (optional); with no password nobody can sign in to it | **secret** |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, share images; set before building | public |
| `GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_GA_ID` | Search Console tag; GA4 id (loads only after cookie consent) | public |
| `ERROR_WEBHOOK_URL` | Slack or Discord error alerts (optional) | **secret** |
| `DATA_DIR`, `ALLOW_HTTP` | Local overrides | internal |
| `ALLOW_EPHEMERAL_BOOKINGS` | Set to `true` only on a demo deployment with no database: it keeps booking open although bookings can vanish (see below) | internal |

Rules: a secret never gets a `NEXT_PUBLIC_` prefix; `.env*` is git-ignored except `.env.example`, which lists names with no values. Add a new variable to `.env.example`, `src/lib/env.ts`, this file and `docs/GO-LIVE.md`.

`/api/health` reports whether production is ready (durable storage, realtime, logins set and strong enough). Check it after every deploy.

## Database changes

Write the SQL as an idempotent file in `supabase/migrations/`, mirror it in `supabase/setup/`, run it against a scratch Postgres with `npm run test:sql`, and only then run it on production in the Supabase SQL editor (see `docs/GO-LIVE.md`). Never run `supabase/reset-before-launch.sql` or `reset_state()` on production data.

## A deployment with no database

On Vercel with no `SUPABASE_SECRET_KEY`, the app keeps data in a temporary file that belongs to one server instance. A booking made there can disappear (the next request may reach another instance), and the ticket link then shows "We can't find this booking". So holds and bookings are refused with "Booking is not open on this site yet" until the database is connected. Connect it by adding `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` for that environment in Vercel (Production and Preview are separate lists) and redeploying. Use a staging Supabase project for Preview rather than the production one. Check `/api/health`: it must show `"storage":"supabase"`.
