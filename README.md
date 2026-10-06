# OYUN

Turf booking platform: public booking site, partner (turf owner) dashboard and admin console. Next.js App Router with a Supabase Postgres backend.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill it in.
3. Create the database schema: run `supabase/migrations/20261006000000_oyun_store.sql` in the Supabase SQL editor (or `supabase db push` with the Supabase CLI).
4. `npm run dev` and open http://localhost:3000. The first request seeds demo turfs, partners and bookings.

Without `SUPABASE_SECRET_KEY` the app stores data in `.data/db.json` instead, which is handy for local work but is not shared between servers.

## Deploying (Vercel)

Add every variable from `.env.example` in the Vercel project settings, apply the migration to the Supabase project once, then deploy.

## Launch checklist

See [docs/LAUNCH-SEO.md](docs/LAUNCH-SEO.md) for Search Console, analytics, error alerts and the backlink plan.

## How data is stored

`src/lib/store.ts` is the only module that talks to storage. Pages call `await getDb()`; server actions call `await mutate(db => ...)`, which reloads the latest data, runs the change and writes only the rows that changed in one transaction (`apply_changes`). If another write landed in between, it retries on fresh data. Postgres enforces one live booking per turf slot, so two people can never book the same hour.

All tables have row-level security on with no policies: only the server, using the secret key, can read or write them.
