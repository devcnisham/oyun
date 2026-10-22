# Staging Environment Setup (P8-12)

This runbook guides setting up and operating the OYUN staging environment using **Vercel Preview Deployments** and **Supabase Database Branching**.

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

- **Isolated State**: Preview deployments connect to dedicated Supabase database branches instead of production data.
- **Automated Smoke Gate**: Every preview triggers `scripts/smoke-test.mjs` verifying endpoints before traffic promotion.
- **Fail-Safe**: If a staging migration or preview fails, production remains untouched.

---

## 2. Supabase Database Branching Setup

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → Project `duwkypegndkkgfzjgiok` → **Database** → **Branching**.
2. Click **Enable Branching**.
3. Create a branch named `staging` (or link to your GitHub repository for automatic PR branches).
4. Note the dedicated Branch connection string and API keys:
   - `NEXT_PUBLIC_SUPABASE_URL` (branch URL)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (branch anon key)
   - `SUPABASE_SECRET_KEY` (branch service role key)

---

## 3. Vercel Preview Configuration

In Vercel → **Settings** → **Environment Variables**:
Set environment variables scoped to **Preview**:

| Variable | Scope | Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Preview | Supabase branch project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Preview | Supabase branch publishable key |
| `SUPABASE_SECRET_KEY` | Preview | Supabase branch secret key |
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
