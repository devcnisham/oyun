# Project structure

One Next.js app, one deploy, three products: the player site (`web`), the owner dashboard (`partner`) and the admin console (`admin`). Code is grouped per product, then per layer. Routes stay in `src/app` because Next.js requires it.

```
src/
  app/                      Routes only (pages, layouts, route handlers). Thin: call into modules.
    (main) (auth) (launch)  Player site       -> src/modules/web
    partner/                Owner dashboard   -> src/modules/partner
    admin/                  Admin console     -> src/modules/admin
    api/                    Route handlers (webhooks, cron, health, uploads)
  modules/
    web/                    Player site
      frontend/             Components, consent, client hooks (hooks/); route components in main/, launch/, auth/
      backend/              Server actions and server services (bookings, recurring, payments, search, notifications)
      database/             Read queries for the site
      lib/                  Pure logic: SEO, sports, i18n, availability, cancel policy
    partner/                Owner dashboard
      frontend/             Dashboard components (CourtTimeline, CheckInDesk, NavLinks...), auth/
      backend/              partner-actions, social, check-in window
      database/             activity log writes, calendar (reads the store)
    admin/                  Admin console
      frontend/             AdminShell, tab bar, banners, pending applications
      backend/              admin-actions
      database/             analytics (reads the store)
    shared/                 Used by two or more of the above
      database/             store.ts (the only storage gateway), types, seed, ids, supabase/ clients, data/
      backend/              session, auth, rate limits, realtime, hosts, csp, env, errors, monitoring
      lib/                  Pure logic: pricing, wallet, hours, time, reports, reviews, payouts
      frontend/             Dashboard kit (dash/), login screens (auth/), invoice, skeleton, status
  test/                     Test helpers and cross-cutting tests (cross-cutting/)
  proxy.ts, instrumentation*.ts   Must stay at src/ root (Next.js convention)
supabase/                   One Postgres for all three products
  migrations/               The real history (flat: the Supabase CLI needs it flat)
  setup/                    The same SQL split for the SQL editor
  tests/                    SQL tests
  proposals/                Design proposals
docs/                       All documentation (see docs/README below)
scripts/                    Dev, CI and ops scripts
e2e/                        Playwright tests
```

## Where does new code go?

1. Used by one product only: that product's folder.
2. Used by two or more: `shared`.
3. Needs the browser (JSX, hooks, CSS): `frontend`. Runs on the server (actions, services): `backend`. Reads or writes stored data: `database`. No I/O, no React: `lib`.
4. Pages in `src/app` import from `@/modules/...`. Never import `partner` or `admin` code from `web` (and the reverse). Go through `shared`.
5. Tests sit next to the file they test as `name.test.ts`. A test about several files goes in `src/test/cross-cutting/`.

## Database

One Postgres, one gateway: `src/modules/shared/database/store.ts`. The three products share the same tables, so there is one migration history in `supabase/migrations/` (flat and timestamp-ordered, which the Supabase CLI requires). Which product mainly owns which tables is in `supabase/README.md`. `docs/SLOT-BOOKING-DB.md` and `docs/adr/` explain the design.
