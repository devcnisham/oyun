# Staging Environment Setup (P8-12)

This runbook guides setting up and operating the OYUN staging environment using **Vercel Preview Deployments** and **a separate staging Supabase project**.

---

## 1. Architecture Overview

```
                      GitHub Pull Request / Staging Branch
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
    Vercel Preview Deploy                         Supabase Branch DB
    (slot-arena-*.vercel.app)                  (Ephemeral Postgres Clone)
              │                                               │
              └───────────────► Smoke Gate ◄──────────────────┘
                          (scripts/smoke-test.mjs)
                                      │
                                      ▼
                           Ready for Promotion Gate
```

- **Isolated State**: Preview deployments connect to the staging Supabase project instead of production data.
- **Automated Smoke Gate**: Every preview triggers `scripts/smoke-test.mjs` verifying endpoints before traffic promotion.
- **Fail-Safe**: If a staging migration or preview fails, production remains untouched.

---

## 2. The staging database: a separate Supabase project

Branching needs the Pro plan, so staging is its own project, **oyun-staging** (ref `lfcyekfjwhaeihesdyxo`, same region as production, free plan). It is empty of real data and safe to wipe.

It already has every migration in `supabase/migrations/` applied (through `20261022`), and the `oyun` schema is exposed to the REST API (the app reads it with `.schema('oyun')`; without this every call fails with `PGRST106 Invalid schema`). To rebuild it from scratch on a new project:

1. Apply `supabase/migrations/*.sql` in order (SQL editor, or `supabase/setup/` files).
2. Expose the schema, once: `alter role authenticator set pgrst.db_schemas = 'public, graphql_public, oyun'; notify pgrst, 'reload config';`
3. Check: `select public.parity_report();` returns `"ok": true`.

**Production is not set up this way yet**: before `OYUN_V2_SLOTS=1` goes live there, run step 2 on the production project (or add `oyun` under Project Settings -> API -> Exposed schemas).

### Run the app against it locally

```bash
cp .env.staging.example .env.staging.local   # then paste the secret key (Supabase -> oyun-staging -> API Keys)
npm run dev:staging                           # http://localhost:3001, relational slots on
npm run staging:sync                          # after the first page load has seeded the turfs
```

`dev:staging` and `staging:sync` refuse to run if the URL is the production project. The first page load fills the empty database with the launch turfs; `staging:sync` then creates their venues, courts and bookables and prints the parity report.

Wipe it any time with `select public.reset_state();` plus `delete from oyun.venues;` (cascades to courts, bookables and bookings).

## 3. Vercel Preview Configuration

In Vercel → **Settings** → **Environment Variables**:
Set environment variables scoped to **Preview**:

| Variable | Scope | Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Preview | oyun-staging project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Preview | oyun-staging publishable key |
| `SUPABASE_SECRET_KEY` | Preview | oyun-staging secret key |
| `SESSION_SECRET` | Preview | 32+ character random secret |
| `CRON_SECRET` | Preview | Dedicated staging cron token |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Preview | Staging operator credentials |

---

## 4. Automated Verification

Run smoke tests against the preview environment URL:
```bash
node scripts/smoke-test.mjs https://slot-arena-git-staging-devcnisham.vercel.app
```

Endpoints verified:
- `/api/health`: Database and realtime status
- `/`: Public landing page
- `/arenas`: Turf directory
- `/api/monitoring/double-bookings`: Double booking count equals 0
