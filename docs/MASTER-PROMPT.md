# OYUN master build prompt

Paste everything below the line into Claude Code, opened in `/Users/nishhaamm/Desktop/slot-arena`.

---

You are the lead engineer finishing **OYUN**, a multi-sport turf and court booking platform for Mangalore (football, box cricket, badminton, pickleball, padel). It has a public booking site, a partner dashboard for turf owners and staff, and an admin console. Stack: Next.js 16 App Router, Supabase Postgres, Clerk for players, Vercel. Work through the remaining phases below **one task at a time, in order**, to a senior production standard. Security is never optional.

## Read first, every session

1. `CLAUDE.md` and `AGENTS.md`. This Next.js version has breaking changes, so read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.
2. `README.md`, `docs/GO-LIVE.md`, `docs/LAUNCH-SEO.md`, `FEATURE_LIST.md`.
3. `docs/SLOT-BOOKING-DB.md`, `supabase/proposals/slot_booking_v2.sql` and `supabase/proposals/slot_booking_v2_test.sql`. This is the target database design: resources, bookables, slot_claims with an exclusion constraint, holds, payments. It is tested: 30 scenarios and a concurrency race on Postgres 17.
4. `src/lib/store.ts`, `src/lib/booking-actions.ts`, `src/lib/pricing.ts`, `src/lib/types.ts` (current behaviour).
5. `git log --oneline -20` and open PRs, to see what has already landed.

## How to work

- **One task = one branch = one PR.** Name the branch `claude/<short-task>`, branched from up-to-date `main`. Keep each PR small and focused, and never mix phases.
- Before coding, write a short plan for the task: files, migration, tests and risks. Then implement it.
- **Verify before claiming done:**
  - `npm run lint`, `npx tsc --noEmit` and `npm run build` all pass.
  - Tests for the task are written and passing.
  - For UI, run the app with `npm run dev` and exercise the flow.
  - For SQL, run it against a local scratch Postgres (Homebrew `postgresql@17` is installed), never against production.
- Commit messages are imperative and specific. The PR description says what changed, why, how it was tested and any follow-ups.
- After each merged PR, record it the same way this repo already does: a `Tracker: record PR #N` change to `docs/build-tracker.html`, and tick the box in `FEATURE_LIST.md`.
- If you have the `ArtifactData` tool, also tick the matching check in the online tracker https://claude.ai/artifact/35wzPaptoBWJYiq3fncuTQ. Use `set` on collection `ticks`, doc id = the check id (e.g. `R001`, `B020`), with data `{ "done": true, "at": "<ISO time>", "by": "claude-code" }`.
- **Stop and ask me** before you:
  - run anything against the production Supabase project (`nimfjwxzolkwiyqmnaat`)
  - delete data, or run `supabase/reset-before-launch.sql`
  - change Vercel or Clerk settings, or rotate keys
  - add a paid service, or choose between product options
- I set every secret myself. Never print, commit or ask me to paste a secret. Use `.env.example` for names only.
- Money is always integer rupees (or paise for the gateway). Times are IST for display and `timestamptz` in the database.
- Don't invent data on the site: no fake stats, reviews or sponsors.

## Security rules for every PR

1. **Every server action and route:**
   - authenticate the caller
   - authorize on the server against the exact record: a player only touches their own bookings, a partner or staff member only their own venues, admin only via the admin session
   - validate input with a schema, and rate-limit
2. Only parameterised queries or RPC. Never build SQL from strings. Never put `innerHTML` with user data.
3. Secrets only on the server. RLS stays on, and only the service role touches tables. Never expose the secret key to the client.
4. Webhooks verify the signature, are idempotent (store each event id once) and run in a database transaction.
5. Log errors without personal data (no phone numbers, tokens or cookies). Audit-log sensitive actions: refunds, role changes, blocks, price changes, payouts.
6. Add or keep security headers. Run `npm audit` and fix high and critical issues before merging.
7. Add a test for each authorization rule you touch, e.g. "player B cannot cancel player A's booking".

## Phases (do in order; tick each when merged)

### Phase 0: Make the live site safe and real (do first)
- [ ] **R001 Connect production to Supabase.** I add the env vars in Vercel and run the migrations. You:
  - write a checklist PR so `/api/health` must show `storage: supabase`, `bookingsSharedBetweenPlayers: true`, `realtimeSlotUpdates: true`
  - make the admin dashboard show a blocking red banner if not
- [ ] **R002 Admin and partner logins in production.** Document the exact env vars and check they're set via `/api/health`.
- [ ] **R003 Realtime slot updates on in production.**
- [ ] **R006 (security) Clerk key rotation.** Remind me, and confirm no secret is in git history (`git log -p | grep -i -E "sk_live|sk_test|sb_secret"`). If one is found, tell me which key to rotate. Don't rewrite history without asking.
- [ ] **R004 Remove the made-up home page stats.** Replace them with real counts from the database (turfs listed, areas, bookings made), or remove the strip.
- [ ] **R005 Remove the Nike, Apple, Puma and Adidas ads.** Make the slider admin-managed (Admin → Customization) and empty by default.
- [ ] **R015 / R016 Multi-sport wording.**
  - Site title, hero and meta stop saying football-only.
  - Turf pages show the right sport name and icon.
  - Add Padel to the sports list.

### Phase 1: Engineering foundations
- [ ] **R017 CI.** A GitHub Actions workflow on every PR that runs `npm ci`, lint, type-check and build, plus the SQL tests against a Postgres service container. Pin actions by SHA and give it least permissions.
- [ ] **Test setup.**
  - Vitest for `src/lib` (pricing, cancel policy, wallet, validation).
  - Playwright for the critical flows: browse → hold → book → cancel, partner check-in, admin approve turf.
- [x] **R011 Persistent rate limits.** Move `src/lib/rate-limit.ts` from in-memory counters to Postgres, behind the same function signature.
- [x] **R018 Update `FEATURE_LIST.md`** to match reality.

### Phase 2: Slot booking database v2
Follow `docs/SLOT-BOOKING-DB.md` → "Moving the app over".
- [x] **Turn the proposal into real migrations.**
  - Move it into `supabase/migrations/<timestamp>_slot_booking_v2.sql` plus matching `supabase/setup/` steps.
  - Add `public` wrapper functions for the RPCs, or expose the `oyun` schema.
  - Keep the test script passing in CI.
- [x] **Data mapping.**
  - Seed and migration code turns each existing turf into a venue with resources and bookables.
  - A plain turf gets one resource. A `halfPitch` turf gets Half A, Half B and three bookables.
  - Each badminton or pickleball court is its own resource.
  - Partner screens are added to manage courts and bookables.
- [x] **R007 Multi-court venues.** The booking flow lets the player pick a court or pitch size. Slot lengths come from the bookable.
- [x] **R009 Any slot length and after-midnight slots** in the UI: slot grid, invoices, calendar file, check-in.
- [ ] **Switch slots over.**
  - `getSlotsForDate` → `available_slots`
  - `holdSlots` → `hold_slots`
  - `createBookings` → `confirm_hold`
  - `cancelMyBooking` → `cancel_booking`
  - partner blocks and walk-ins → `block_slot` and `hold_slots` + `confirm_hold`
  - Keep the realtime broadcast after each change.
- [ ] **R010 One order per checkout.** A multi-hour booking is one booking with several items: one code, one invoice, one cancel or refund.
- [ ] **R008 Retire the jsonb store** for booking data: `bookings`, `holds`, `blocks`, `pricing`. Remove `load_changes` and `apply_changes` usage for them.
- [ ] **Expire holds every minute** with pg_cron (`select oyun.expire_holds()`).
- [ ] **Move everything else off the jsonb store** (partners, staff, players, reviews, promos, add-ons, settings), then delete the old tables in a separate PR, only after I confirm.

### Phase 3: Payments and money
- [ ] **R014 Razorpay online advance.**
  - Server creates the order and sets `confirm_hold(..., pay_online => true)`.
  - Checkout uses Razorpay Checkout (no card data touches our servers).
  - `/api/webhooks/razorpay` verifies `X-Razorpay-Signature` with the webhook secret, stores the event in `payment_events`, then calls `confirm_payment`.
  - Handle `refund_needed` by issuing the refund through the API.
  - Test everything in Razorpay test mode only.
- [ ] **Refunds per cancellation policy.** Store per-venue cut-offs, issue partial refunds, and refund in full when the venue cancels. Every refund is audit-logged.
- [ ] **R013 Wallet.** The ledger is the only source of truth and the balance is computed from it. Spending locks the player row in the same transaction and can never go below zero.
- [ ] **R012 Promo codes.** Add expiry, max uses and a per-player limit. Redemptions are recorded once per booking.
- [ ] **Partner payouts** from the commission ledger, using the payouts and payout_items tables in v2. Settlement export, and GST invoices with gap-free numbering per financial year.
- [ ] **Daily reconciliation job:** payments vs bookings vs payouts. Alert me on any mismatch.

### Phase 4: Security hardening (full pass)
- [ ] **Authorization audit** of every server action in `src/lib/*-actions.ts` and every route in `src/app/api`. Write a table of action → who may call it → test. Fix every gap.
- [ ] **Partner tenant isolation.** A partner or staff member can only read and write their own venues, bookings, payouts and staff. Front-desk staff cannot change prices or payouts.
- [ ] **Sessions.**
  - Admin and partner sessions are HttpOnly, Secure and SameSite, rotated on login, with idle and absolute expiry.
  - Brute-force lockout on admin and partner login.
  - Optional TOTP for admin.
- [ ] **CSP.** Move to nonces if supported by this Next.js version, and drop `'unsafe-inline'` for scripts.
- [ ] **Bot protection.** Turnstile or Clerk bot protection on signup, list-your-turf and the hold endpoints.
- [ ] **Privacy (India DPDP Act 2023).**
  - The privacy notice matches what we actually collect.
  - Players can export and delete their data.
  - Retention: purge expired holds and old logs.
  - Hide players' phone numbers from other players.
- [ ] **Supply chain.** Dependabot, `npm audit` in CI, secret scanning, `.env*` ignored.
- [ ] **Backups.** Confirm Supabase point-in-time recovery is on, and write a restore runbook in `docs/`.
- [ ] **Write `docs/SECURITY.md`:** threat model, how to report issues, incident response steps.

### Phase 5: Booking features players and owners need
- [ ] **Notifications.**
  - Booking confirmation and a reminder 2 hours before the slot, via WhatsApp or SMS (ask me which provider), with a Maps link.
  - Cancellation alerts.
  - Opt-out respected.
- [ ] **Search filters:** sport, area, date and time, price range, amenities. Map view (ask me Google or Mapbox).
- [ ] **Partner calendar:** day and week view across all courts.
- [ ] **Recurring weekly bookings**, with a conflict check on every occurrence.
- [ ] **Waitlist** for full slots: notify the next player when a slot frees up.
- [ ] **Split payment:** share a UPI or Razorpay link with teammates.
- [ ] **Find players / open matches** (the key differentiator in `FEATURE_LIST.md`).

### Phase 6: Quality before launch
- [ ] **Concurrency test in CI:** two clients book the same slot and exactly one succeeds.
- [ ] **Playwright end-to-end tests** on mobile and desktop sizes for every critical flow, including payment test mode and refunds.
- [ ] **Accessibility:** axe with zero critical issues, keyboard navigation through booking.
- [ ] **Performance:** Lighthouse ≥ 90 on home, arenas and turf pages; load-test peak booking with k6.
- [ ] **Test bad paths:** payment failure, late webhook, hold expiry, slots after midnight, a half-pitch and full-pitch clash, a badminton and pickleball shared-court clash.

### Phase 7: Launch and growth
- [ ] **SEO.**
  - Landing pages per city, area and sport.
  - Structured data (SportsActivityLocation, reviews, opening hours).
  - Sitemap and Search Console.
- [ ] **Monitoring.**
  - Error alerts (`ERROR_WEBHOOK_URL`) and uptime checks.
  - A booking success rate and double-booking dashboard (double bookings must be 0).
- [ ] **Runbooks:** go-live checklist re-verified, rollback steps, on-call contacts.

### Phase 8: Ongoing maintenance
- [ ] Monthly dependency updates, a quarterly backup restore drill and a quarterly access review. Rotate secrets when staff leave.

## Reporting back after each task

Reply with:
1. what changed (PR link)
2. how you verified it (commands and their results)
3. security notes
4. anything I must do myself (env vars, dashboards)
5. the next task you will start

Then start the next task unless it needs my decision.

Start now with Phase 0, task R001.
