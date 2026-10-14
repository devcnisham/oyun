# OYUN task workflow

Run `/next-task` (see `.claude/commands/next-task.md`). Each run does one task: branch, code, tests, PR, tracker. Tasks run one by one in the order below. `/loop /next-task` chains them; the loop stops itself at a GATE.

Status: `[x]` merged, `[ ]` open, `GATE` needs a human decision or action first, `BLOCKED` was skipped for a gate.
First step of every run: tick anything already merged (check `git log`). Merged as of 9 Oct 2026: R001 to R005, R015, R016, R017, Vitest lib tests (PR #64 to #71). Verify R006 and R018 before starting them.

## Queue

### A. Safe and real (Phase 0)
- [x] R006 Check git history for leaked keys (`git log -p | grep -i -E "sk_live|sk_test|sb_secret"`). Report only. GATE: user rotates any key found.
- [ ] P8-00c Local and Vercel data parity (`SUPABASE_SECRET_KEY` empty locally). GATE: user sets the secret.

### B. Foundations (Phase 1)
- [x] R018 / P8-10 Refresh `FEATURE_LIST.md`; delete `replace_colors.py`, `update_fonts.py`, `update_texts.py` after checking nothing uses them.
- [x] P8-01 Install deps, read Next 16 docs, note conventions in `docs/`.
- [x] P8-09 `typecheck` script and pre-commit hook.
- [x] P8-11 Dependabot and `npm audit` in CI.
- [x] P8-58 Secret scan (gitleaks) step in CI.
- [x] P8-04 Integration test: N parallel `createBookings` on one slot gives one booking.
- [x] P8-05 Integration test: holds expire and release.
- [x] P8-06 Authorization sweep: every admin and partner action rejects without a session.
- [x] R011 / P9-06 Persistent rate limits in Postgres, same function signature. GATE left: owner runs `supabase/setup/8-rate-limits.sql` on production (P9-22).
- [x] P8-07 Playwright e2e: browse, hold, book, ticket, cancel; partner check-in; admin approve turf.
- [ ] P8-12 Staging environment. GATE: Vercel and Supabase branch setup.

### C. Security fixes (Phase 4 items that are small and urgent)
- [x] P9-18 Remove the hard-coded admin and partner credentials from the login form. P9-20 Remove the seed default partner password and heal old stores. (Found in the online tracker, missing from this queue.)
- [x] P9-02 `import 'server-only'` in `utils/supabase/admin.ts`, `store.ts`, `realtime.ts`.
- [x] P9-04 Refund `walletDeduction` on cancel (verify the bug first, add a test).
- [x] P9-10 DTOs: strip `passwordHash` and phones before anything reaches a client component.
- [x] P9-05 Ticket page: phone masked (PR #98); cancel and review on anonymous tickets need the booking phone (PR #122). Not a signed token; real identity is P9-03.
- [x] P9-03 Bind wallet and booking identity to the Clerk account, not a typed phone (PR #216).
- [x] P9-07 Lockout keyed by email plus IP.
- [x] P9-08 / R012 Promo codes: expiry, max uses, per-player limit.
- [x] P9-11 Check-in requires cash-collected confirmation.
- [x] P9-12 Validate turf image URLs, allowlist hosts.
- [x] P9-27 Cron routes fail closed without `CRON_SECRET` (OYUN-307). GATE left: owner sets `CRON_SECRET` on production; payout settlement stays unscheduled until real transfers replace the simulation (P11-10).
- [x] P9-14 CHECK constraints: wallet and amounts not negative.
- [x] P9-16 Remove or document the unused Supabase auth proxy step.
- [x] P9-13 CSP nonces, drop `'unsafe-inline'` for scripts (PR #215).
- [ ] P9-09 Admin MFA, per-user accounts, session revocation. GATE: choose TOTP vs Clerk for admin.
- [ ] P9-01 Rotate the old Supabase secret key. GATE: user only.

### D. Database v2 (Phase 2, follow `docs/SLOT-BOOKING-DB.md`)
- [x] Turn `supabase/proposals/slot_booking_v2.sql` into a migration plus `supabase/setup/` steps and `public` RPC wrappers (PR #220, #133).
- [x] Data mapping: turf to venue, resources, bookables; partner screens for courts (#134).
- [ ] R007 Multi-court venues in the booking flow.
- [ ] R009 Any slot length and after-midnight slots (grid, invoice, calendar, check-in).
- [ ] Switch slots over to the v2 functions, keep the realtime broadcast.
- [ ] R010 One order per checkout.
- [ ] R008 Retire the jsonb store for bookings, holds, blocks, pricing.
- [ ] pg_cron expire holds (P10-06). GATE: runs on production only after user approves.
- [ ] P10-02 Per-turf version (may be superseded by v2).
- [ ] Move remaining tables off jsonb. Delete old tables in a separate PR. GATE: user confirms.

### E. Payments (Phase 3)
- [ ] GATE: user decides Razorpay account and test keys. Then: P11-01 order and signature, P11-02 idempotent webhook, P11-03 advance mode (R014), P11-04 gateway refunds, P11-06 payment-state tests, refunds per cancellation policy, R013 wallet ledger, partner payouts and GST invoices, P11-05 reconciliation job.

### F. Performance and UX
- [x] P10-03 ISR and tag revalidation for public pages.
- [x] P10-05 `loading.tsx` and Suspense on data pages.
- [x] P10-04 Slot map: Supabase Realtime broadcast plus refetch on focus and tab visibility (`src/lib/client/use-slot-updates.ts`); the 10 s poll is only a safety net.
- [ ] P10-09 Optimise images. GATE: Supabase Storage setup.
- [x] P10-08 k6 load test: `scripts/k6/browse.js` covers the public read path (`docs/LOAD-TEST.md`). The booking writes are covered by the SQL race test and e2e (server actions cannot be replayed from k6); not run yet, needs staging.

### G. Features (Phase 5)
- [ ] GATE: user chooses WhatsApp or SMS provider. Then P12-01 confirmation, P12-02 reminder, P12-03 owner alerts, P12-04 email receipts, P12-05 web push.
- [ ] P13-04 Search filters; GATE: user chooses Google Maps or Mapbox for the map.
- [x] Partner calendar day and week view (single turf; "across all courts" waits for R007 multi-court).
- [x] P13-06 Waitlist and recurring weekly bookings (PR #225).
- [x] Split payment link (PR #221).
- [x] P13-15 Rain policy in cancel and refund: owner or admin declares rain, full wallet refund (OYUN-314); [x] P13-01 Find players and open matches; P13-02 tournaments; [x] P13-03 weather alerts (PR #217); [x] P13-05 admin analytics; [x] P13-07 Kannada (PR #218).

### H. Quality and launch (Phases 6 to 7)
- [x] Concurrency test in CI (`scripts/sql-race-test.sh`), accessibility (axe, `e2e/a11y.spec.ts`), bad-path tests (`src/lib/bad-paths.test.ts`).
- [ ] Lighthouse 90: CI job and `npm run test:lighthouse` added; job is report-only (`continue-on-error`). First CI run: performance home 45, arenas 84, turf 66; other categories 96 to 100. Stays open until every score is 90 or more and the job is made blocking.
- [x] Privacy (DPDP): export and delete my data, retention purge, notice matches reality. Built in PR #214.
- [x] `docs/SECURITY.md` written (PR docs).
- [x] Backup restore runbook (`docs/RUNBOOKS.md` section 6).
- [x] P8-62 Runbooks: payout failed, refund failed, webhook down, double booking found (`docs/RUNBOOKS.md`).
- [x] SEO landing pages per city (`/arenas`), area (`/turfs/[area]`), sport (`/sports/[sport]`); structured data.
- [ ] Monitoring dashboard (double bookings must be 0), runbooks. GATE: uptime service choice.

## Rules the loop never breaks
One task, one branch, one PR. No production changes, key rotation, deletes, paid services or product choices without the user. Lint, type-check, tests and build must pass before a PR. Never merge unless the user said so for that run.
