# Security

## Reporting a problem

Please report a vulnerability privately. Do not open a public issue or post it anywhere.

- On GitHub: the repository's **Security** tab → **Report a vulnerability** (private reporting), or
- email the support address shown on the site's Help page and put "security" in the subject.

Say what you found, where, and how to reproduce it, without exploiting it on real people's data. We aim to reply within 3 working days and to fix confirmed High issues first. Do not test with other people's accounts, run automated scans against the live site, or access data that is not yours.

## What is protected

| Asset | Where | Main protection |
| --- | --- | --- |
| All app data (turfs, bookings, players, wallets, partner password hashes) | Supabase Postgres | Row-level security on with no policies: only the server's secret key can read or write; CHECK constraints on money fields |
| Secret keys and passwords | Vercel environment variables | Never in git (`.env*` ignored, history scanned); `SUPABASE_SECRET_KEY` is imported only by `server-only` modules |
| Admin and partner sessions | Signed httpOnly cookies | HMAC with `SESSION_SECRET`, 8 hours, scrypt password hashes, login lockout per email and IP |
| Player identity | Clerk, or a device name and phone | Clerk when its keys are set; the device fallback is not authentication (see Known gaps) |

## Controls in place

- Every admin and partner server action checks the caller before it touches data, and partner actions ask for the exact permission; `src/lib/authorization.test.ts` fails if one does not.
- Roles: owner, manager and front desk have different permission sets; front desk cannot change prices, offers, add-ons, the turf profile, staff or payouts.
- Tenant isolation: a test calls every partner action as one owner with another owner's booking, block, offer, add-on and staff ids and checks that nothing changes (`src/lib/tenant-isolation.test.ts`).
- Public pages receive a narrow turf shape (no owner account link or commission); a test blocks client components from importing full internal types. The phone number is masked on public ticket and invoice pages.
- One function prices both the quote and the charge. Wallet spending and promo limits are enforced on the server.
- No double booking: a revision lock plus unique indexes in Postgres, with a parallel race test in CI.
- Input is validated and length-capped on the server; turf image links are restricted to safe forms; CSV exports neutralise spreadsheet formulas.
- Security headers (CSP, HSTS, frame, nosniff, referrer policy, COOP), HTTPS redirect, same-origin check on the hold-release beacon.
- CI: zero lint warnings, type-check, `npm audit` on production packages, tests, SQL tests, end-to-end tests; actions are pinned by commit SHA with read-only tokens; Dependabot is on.

## Known gaps (tracked in `docs/build-tracker.html`)

| Gap | Task |
| --- | --- |
| Without Clerk, wallet spending and booking identity trust an unverified typed phone number | P9-03 |
| Anonymous tickets: anyone holding the `bk_` link can cancel or review that booking | P9-05 |
| Rate limits and lockouts are shared through Postgres once `supabase/setup/8-rate-limits.sql` is run on production; until then each server instance counts its own | P9-22 |
| Admin is one credential: no MFA, no session revocation | P9-09 |
| CSP still allows `'unsafe-inline'` scripts (nonces need per-request rendering, see `docs/NEXT16-NOTES.md`) | P9-13 |
| Realtime topics are public (ping-only payload) | P9-15 |
| No audit log of admin and partner actions | Phase 4 |
| Production secret key rotation and admin and partner password rotation need doing by the owner | P9-01 |

## If something goes wrong

1. **Contain.** If a secret may be exposed, rotate it now: Supabase secret key (Project Settings → API), `SESSION_SECRET` (logs everyone out), `ADMIN_PASSWORD` and `PARTNER_PASSWORD`, Clerk secret key, `ERROR_WEBHOOK_URL`. Redeploy so the new values are live. Revoke the old Supabase key and confirm it returns 401.
2. **Look.** Check Vercel runtime logs and the error webhook; in Supabase look at recent writes to `bookings`, `players` and `wallet_txns`. Note times and what changed. Do not delete evidence.
3. **Stop the harm.** Suspend the affected partner or ban the player in the admin console; pause a promo code; set a turf to maintenance. Use Vercel's instant rollback if a deploy caused it.
4. **Tell people.** If personal data of players or owners may have been exposed, the law can require notice quickly (CERT-In directions require reporting certain incidents within 6 hours; India's DPDP Act requires notifying the Data Protection Board and affected people). Get advice from a lawyer or CA the same day; this file is not legal advice.
5. **Fix and learn.** Fix the cause with a test, write a short blameless post-mortem within 3 days (what happened, how it was found, what changes), and update the Security tab of the tracker.

## Keeping it healthy

Each month: review Dependabot pull requests and `npm audit`. Each quarter: list who has production access (GitHub, Vercel, Supabase, Clerk, the domain registrar) and remove anyone who left; restore a backup into a scratch project to prove it works. Rotate secrets whenever someone with access leaves.
