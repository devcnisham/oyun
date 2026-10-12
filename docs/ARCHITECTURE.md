# Architecture

OYUN is one Next.js 16 app (App Router) on Vercel with one Supabase Postgres database. There is no separate API server, mobile app or job runner: the website and the backend are the same code in `src/`. Read `docs/NEXT16-NOTES.md` before writing Next.js code.

```
Player / Owner & staff / Admin
        │ HTTPS
        ▼
 src/proxy.ts  — HTTPS redirect, cookie guard for /admin and /partner, Clerk
        │
 pages (src/app) ──► server actions (src/lib/*-actions.ts) ──► src/lib/store.ts (getDb, mutate)
                                                                   │
                                  Supabase Postgres (14 jsonb tables + app_meta.rev)   Supabase Realtime (slot pings)
```

Players sign in with Clerk when its keys are set (otherwise a name and phone kept on the device). Owners, staff and the admin use cookie sessions signed with `SESSION_SECRET`.

## Where code lives

| Path | What |
| --- | --- |
| `src/app/(main)` | Public site: home, arenas, turf pages, tickets, profile, saved, list-your-turf, help, legal |
| `src/app/(auth)` | Player sign-in and sign-up |
| `src/app/partner` | Owner and staff dashboard; every page and action checks a permission |
| `src/app/admin` | Admin console: approvals, turfs, partners, players, refunds, settings |
| `src/app/api` | `health`, `holds/release`, `client-error` |
| `src/lib` | Domain logic: `store`, `pricing`, `wallet`, `reports`, `reviews`, `session`, `rate-limit`, `login-throttle`, `realtime` |
| `src/utils/supabase` | Supabase clients (the secret-key client is `server-only`) |
| `src/components` | Shared UI: shell, turf cards, consent, dashboard kit, invoice |
| `supabase/` | `migrations/` (the real history), `setup/` (the same SQL split for the SQL editor), `tests/`, `proposals/` (the v2 slot booking design) |

## How a write works

Every change to data goes through `mutate(fn)` in `src/lib/store.ts`:

1. The server loads only the rows changed since the revision it already has (`load_changes`); a cold start loads everything.
2. `fn` runs on a private copy; the change is diffed into upserts and deletes.
3. `apply_changes(changes, expected_rev)` writes them in one transaction **only if** the global revision still equals `expected_rev`. If another write got in first it raises `store_conflict` and `mutate` retries (up to 5 times, with jitter).
4. After a successful write the server broadcasts a "slot changed" ping on `slots:{turf}:{date}` and revalidates pages.

Unique indexes on bookings, blocks and holds are the backstop that stops a double booking even if the revision check were bypassed (`scripts/sql-race-test.sh` proves both).

## Booking lifecycle

`free → held` (8 minutes, tied to a device cookie hash) `→ confirmed` (pay at the turf) `→ checked_in` (QR or code at the venue) `→ reviewed`; a booking can end `cancelled`, `no_show` or `refunded`. Only `confirmed` and `checked_in` occupy a slot. Statuses are TypeScript unions in `src/lib/types.ts`, not database enums. A multi-hour booking is one booking row per hour.

## Rules the code follows

- One function (`src/lib/pricing.ts`) prices both the quote and the charge, so they cannot differ.
- Money is whole rupees. Times are India time, through `src/lib/time.ts`.
- Server actions check the caller first (`requireAdmin()` or `requirePartnerAction(permission)`), validate input, then call `mutate`. `src/lib/authorization.test.ts` fails if one does not.
- Data sent to the browser goes through narrow shapes (`PublicTurf`); a test fails if a client component imports a full internal type.
- Styling is CSS Modules plus tokens in `src/app/globals.css`. No Tailwind, no UI library.

## Known limits

All writes share one revision counter, so two writes on different turfs still conflict (task P10-02). Relationships live inside the JSON, so the database cannot enforce them beyond the CHECK constraints in `supabase/setup/7-check-constraints.sql`. The target design (resources, bookables, exclusion constraints, payments) is in `docs/SLOT-BOOKING-DB.md`.

More: `docs/adr/` (why things are this way), `docs/ENVIRONMENTS.md`, `docs/SECURITY.md`, and the Architecture and Database tabs of `docs/build-tracker.html`.
