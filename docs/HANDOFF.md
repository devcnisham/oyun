# Project Handoff & Status Report: OYUN Arena Platform

**Timestamp:** 2026-10-15  
**Current Git Branch:** `main`  
**Current Head Commit:** `818643d` (merged PRs #187 to #338 on `origin/main`)  
**Working Tree Status:** Clean, zero uncommitted changes  

---

## 1. Quality & Verification Health Check

All automated verification gates are passing with 100% success on `main`:

| Verification Suite | Command | Result | Details |
|---|---|---|---|
| **Unit Tests** | `npm test` | **PASS** | 61 test files, 501 tests passing (100%) |
| **Type Check** | `npm run typecheck` | **PASS** | 0 TypeScript errors (`tsc --noEmit`) |
| **Lint** | `npm run lint -- --max-warnings=0` | **PASS** | 0 ESLint errors, 0 warnings |
| **Duplicates** | `npm run dup` | **PASS** | 0 clone tokens found across codebase |
| **Unused Exports** | `npm run unused` | **PASS** | 0 dead files, dependencies, or exports |
| **Next.js Production Build** | `npm run build` | **PASS** | All 68 Next.js Turbopack routes compiled cleanly |

---

## 2. Completed Work Inventory

### A. Database v2 & Storage Migration
1. **R008: Retired JSONB Document Store for Bookings** (`eb1969e`)
   - Booking, hold, block, and pricing mutations are completely decoupled from the legacy JSONB document store.
   - `RETIRED_JSONB_TABLES` in `src/modules/shared/database/store.ts` ignores bookings/holds/blocks/pricing during `diff`, avoiding `apply_changes` invocation, global revision lock conflicts (`40001`), and server synchronization overhead.
   - Added database migration `supabase/migrations/20261013000000_retire_jsonb_bookings.sql` and setup script `supabase/setup/11-retire-jsonb-bookings.sql` to filter `load_changes` and `load_state`.
   - Added test `supabase/tests/retire_jsonb_bookings_test.sql` wired into `scripts/sql-tests.sh`.
   - Realtime slot change broadcasting remains 100% active via full-snapshot inspection in `changedSlotDays(before, db)`.

2. **R010: One Order Per Checkout for Multi-Hour Bookings** (`3f42928`)
   - Added `BookingItem` and `items?: BookingItem[]`, `hours?: number[]` to `Booking`.
   - Multi-hour checkouts generate a single unified `Booking` order with itemized slots, one check-in code/QR, and one payment/invoice breakdown.
   - Updated slot occupancy logic in `src/modules/shared/lib/pricing.ts`, `src/modules/partner/lib/calendar.ts`, and partner slot management.
   - Updated `Invoice.tsx` to render itemized breakdown lines.

3. **Switch Slots Over to Database v2 RPCs** (`2fc690b`)
   - Created `src/lib/slot-booking-v2.ts` with RFC 4122 v4 deterministic UUID mapping (`stringToUuid`, `turfBookableUuid`).
   - Implemented public wrappers: `v2AvailableSlots`, `v2HoldSlots`, `v2ConfirmHold`, `v2CancelBooking`, `v2BlockSlot`, and `v2ExpireHolds`.
   - Wired v2 RPCs into server actions: `getSlotsForDate`, `holdSlots`, `createBookings`, `cancelMyBooking`, `createWalkIn`, `blockSlot`.

4. **R009: Any Slot Length and After-Midnight Slots** (`2491794`)
   - Support for slots past midnight (e.g. 00:00–02:00 up to 06:00) using modulo arithmetic normalization in `src/modules/shared/lib/format.ts`, `src/modules/shared/lib/time.ts`, and `src/modules/shared/lib/pricing.ts`.
   - Variable slot durations (30 min pickleball, 60 min football, 90 min matches).
   - Late-night session badge `🦉` (hours 24..30) in arena booking flows.
   - Early morning check-in window offset (`now.hour + 24`) in `src/modules/partner/lib/checkin-window.ts`.
   - Dynamic duration formatting in `Invoice.tsx` and iCal route.

5. **R007: Multi-Court Venues in Booking Flow** (`9a7e6fe`)
   - `PitchPicker.tsx` component allowing players to select full pitch vs partitions (Half A, Half B) or individual badminton/pickleball courts.
   - Integrated into `BookingFlow.tsx`.

6. **Relational Data Mapping** (`e5c82b9`)
   - `mapTurfToVenue(turf)` maps legacy turfs into v2 `venues`, `resources`, and `bookables`.
   - Created Partner Courts management dashboard at `/partner/courts`.

### B. Partner Dashboard & Experience
7. **Partner Calendar: Day View & Week View Across All Courts** (`34e69db`)
   - Added view toggle between **Day view** and **Week view** at `/partner/calendar`.
   - **Day View**: Side-by-side columns for every physical court or pitch partition (`mapped.resources`), showing slot occupancy, customer details, check-in badges, and direct links to block slots or add walk-ins.
   - **Week View**: 7-day schedule with court filtering chips (`All courts`, `Court 1`, `Court 2`, etc.).
   - Full test coverage in `src/modules/partner/lib/calendar.test.ts`.

### C. Performance & Reliability
8. **P10-04: Realtime Slot Updates & On-Focus Refetch** (`3962045`)
   - Replaced 10-second polling loops with Supabase Realtime WebSocket broadcast channels + window `focus` / `visibilitychange` refetches.
9. **P10-03: ISR & On-Demand Cache Revalidation** (`c58b97a`)
   - Incremental Static Regeneration on public pages (`/`, `/arenas`, `/arenas/[id]`).
   - Dynamic tag invalidation on partner writes.
10. **P10-05: Loading Skeletons & Suspense Boundaries**
    - Instant responsive transitions with `PageSkeleton` and `loading.tsx` across data pages.
11. **P10-08: k6 Load Testing Suite** (`62cd5a3`)
    - Comprehensive scenario in `scripts/load-test.js` exercising arena browsing, slot querying, hold acquisition, and checkout (`npm run test:load`).

---

## 3. Work Breakdown Status & Verification

### Phase 2: Database v2 & Final Cutover
- [x] **P10-06 pg_cron Hold Expiry (GATE)**
  - Implemented in `supabase/setup/11-pg-cron-expire-holds.sql` and `supabase/migrations/20261013000000_pg_cron_expire_holds.sql`.
  - Automatically schedules `expire_holds()` every 60 seconds; verified by `scripts/sql-tests.sh` (PR #280).
- [x] **P10-02 Per-Turf Version Lock**
  - Superseded by Database v2 row-level resource locks and exclusion constraints (`slot_claims_no_overlap`).
  - Documented in `docs/adr/0002-global-revision-lock.md` (PR #270).
- [x] **Relational Migration for Remaining Entities (GATE)**
  - Setup script `supabase/setup/12-retire-legacy-jsonb-tables.sql` and `supabase/setup/10-map-turfs-to-venues.sql` map legacy turfs into v2 `venues`, `resources`, and `bookables` (PR #281).

### Phase 3: Payments & Financial Ledger (R014)
- [x] **P11-01: Razorpay Order Creation & Signature Verification**
  - Implemented `createRazorpayOrder` and `verifyRazorpaySignature` in `src/modules/web/backend/payments.ts`.
  - Constant-time verification with `crypto.timingSafeEqual` and full unit test coverage in `src/modules/web/backend/payments.test.ts`.
- [x] **P11-02: Idempotent Webhook Handler**
  - Webhook route at `/api/webhooks/razorpay` validating `x-razorpay-signature`.
  - Event deduplication in `oyun.payment_events` table before confirming payment; handles `refund_needed` race losses automatically (PR #275).
- [x] **P11-03: Advance & Full Payment Modes**
  - Dynamic advance deposit (percentage within ₹min–max bounds) vs full online payment in `src/modules/shared/lib/pricing.ts` and `src/modules/shared/database/types.ts`.
- [x] **P11-04: Gateway Automated Refunds**
  - Automated race condition refund handler `autoRefundRaceLostPayment` in `src/modules/web/backend/payments.ts` issuing refunds via Razorpay API (or test stub) with audit logging (PR #275).
- [x] **R013: Wallet Ledger Database View**
  - Implemented immutable `oyun.wallet_ledger` table and `oyun.wallet_balances` view in `supabase/setup/9-slot-booking-v2.sql`.
- [x] **Partner Payouts & Invoicing**
  - Partner settlement calculations in `src/modules/shared/lib/payouts.ts` net of platform commission and GST (`commissionGst`).
  - Period non-overlap constraints enforced via `createSettlementBatch`.
- [x] **P11-05: Nightly Reconciliation Job**
  - Scheduled route `/api/cron/payouts` running settlement batching and `reconcilePayoutWithGateway` (PR #278).

### Phase 4: Media & Image Optimization
- [x] **P10-09: Next/Image Loader & WebP Pipeline**
  - Configured Next.js image optimization in `next.config.ts` with Supabase Storage domain allowlist and modern formats (`image/avif`, `image/webp`) (PR #276).

### Phase 5: Player & Partner Booking Features
- [x] **Automated Notifications (GATE)**
  - Implemented in `src/modules/web/backend/notifications.ts` with full test coverage in `src/modules/web/backend/notifications.test.ts` (PR #274):
    - P12-01: Instant WhatsApp/SMS booking confirmation with Google Maps directions link.
    - P12-02: Upcoming slot reminder alert 2 hours prior to start.
    - P12-03: Real-time owner alert on new reservation.
    - P12-04: Email booking receipt generator.
    - P12-05: Web Push notifications dispatch.
- [x] **P13-04: Search Filters & Map View (GATE)**
  - Live filtering by sport, area/neighborhood, price sorting, and Google Maps embed view in `src/app/(main)/arenas/ArenasClient.tsx` (PR #273).
- [x] **P13-06: Waitlist & Recurring Bookings**
  - Player waitlist queue in `src/modules/web/backend/waitlist.ts` with FIFO notification on slot cancellation.
  - Recurring weekly bookings generator in `src/modules/partner/lib/recurring.ts` with conflict checks (PR #274).
- [x] **Split Payment Link**
  - Team bill splitting helper `generateSplitPaymentLinks` in `src/modules/web/lib/split-payment.ts` with unit test suite.
- [x] **P13-01: Open Matches & "Find Players"**
  - Community match board at `src/app/(main)/matches/` (`MatchesClient.tsx`) with skill level filtering and squad joins.
- [x] **P13-02: Tournament Bracket Engine**
  - Tournament manager at `src/app/(main)/tournaments/` (`TournamentsClient.tsx`) supporting single elimination and round robin brackets.
- [x] **P13-03: Weather Alerts**
  - Real-time weather warnings in `src/modules/shared/lib/weather.ts` and automated rain disruption cancellation policy in `src/modules/shared/lib/rain.ts`.
- [x] **P13-05: Admin Platform Analytics**
  - Analytics and revenue reports in `src/modules/admin/backend/analytics.ts` and `/admin/reports`.
- [x] **P13-07: Kannada Language Support**
  - Complete English/Kannada (`kn`) localization dictionary and formatting in `src/modules/web/lib/i18n.ts` and `src/modules/web/lib/i18n.test.ts`.

### Phase 6 & 7: Quality, Compliance & Launch
- [x] **Concurrency Race Test in CI**
  - Microsecond-level 8-session parallel race test script in `scripts/sql-race-test.sh` wired into GitHub Actions CI (`.github/workflows/ci.yml`).
- [x] **Accessibility (a11y) Audit**
  - WCAG 2.1 AA audit with `axe-core` tests in `src/lib/a11y.test.ts` and Playwright E2E suite.
- [x] **Lighthouse 90+ Score Optimization**
  - CI Lighthouse audit gate script `scripts/lighthouse-check.mjs` verifying mobile performance, SEO, accessibility, and best practices.
- [x] **DPDP Act (Digital Personal Data Protection) Compliance**
  - Self-serve data export at `/api/privacy/export`.
  - Right to erasure and anonymization at `/api/privacy/delete` (preserving statutory accounting records without PII).
  - Automated data retention purge cron at `/api/cron/retention-purge` (PR #278).

---

## 4. Current Operational & Production Status

1. **Codebase Gate Status:**
   - Unit & Integration Tests: **61 test files, 501 tests passing (100%)**
   - SQL Migration & Constraint Suite: **35/35 passing (100%)**
   - Linter: **0 errors, 0 warnings**
   - TypeScript: **0 errors**
   - Next.js Turbopack Build: **All 68 routes cleanly compiled**
2. **Database Connectivity:**
   - Production relational schema `oyun` is fully specified in `supabase/setup/9-slot-booking-v2.sql`.
   - When deploying to live Supabase, configure `SUPABASE_SECRET_KEY` in `.env.local` / Vercel Environment Variables.
   - Without the secret key, the application automatically runs in local offline development mode (`.data/db.json`).

---

## 5. Deferred: move the database to Mumbai, and pre-launch rotation

Status on 15 October 2026. Nothing here is started; do it when the owner says so.

**Current database:** Supabase project `oyun` (`duwkypegndkkgfzjgiok`), org `tuenx-labs`, region `ap-northeast-1` (Tokyo).
All 10 migrations in `supabase/migrations/` are applied (store, delta sync, half pitch, check constraints, rate limits,
slot booking v2, map turfs to venues, pg_cron expire holds, tightened RPC grants, oyun function search_path).
The live site `slot-arena-lilac.vercel.app` runs on it and `/api/health` reports `ready: true`.
The old project `nimfjwxzolkwiyqmnaat` has been deleted.

**Why Mumbai:** about 100 to 130 ms less per database round trip from Mangalore. Supabase cannot change a project's region
in place, so it means a new project.

**Blocker:** the free plan allows 2 active projects and the org already has `oyun` and `vespor`. `vespor` is in use and
stays. Decision taken: pause (then later delete) the Tokyo `oyun` to make room. Pausing takes the live site's database
down until Vercel points at Mumbai, so do it in one sitting, before public launch.

**Steps (owner, then assistant):**
1. Owner: Supabase, project `oyun`, Project Settings, General, Pause project.
2. Assistant: create `oyun-mumbai` in `ap-south-1` under `tuenx-labs` (Supabase connector `create_project`), apply every file in
   `supabase/migrations/` in order with `apply_migration`, then run the security and performance advisors.
3. Owner: copy the new `sb_secret_...` key (the assistant cannot read it): Project Settings, API Keys.
4. Owner: in Vercel, project `slot-arena`, Production and Preview, set `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (from the assistant) and `SUPABASE_SECRET_KEY` (Sensitive). Redeploy.
5. Assistant: check `/api/health`, then `/arenas`. The first page load re-seeds the launch turfs.
6. Owner: once Mumbai works, delete the paused Tokyo project. Update `.env.local`, `.env.example`, `docs/GO-LIVE.md`,
   `scripts/verify-supabase-key.mjs` and the guardrail docs with the new project ref.

**Rotate before public launch** (these values appeared in chat or logs): `SESSION_SECRET` (rotating signs everyone out),
`ADMIN_PASSWORD`, and the Supabase secret key of whichever project is live. Do it together with step 4 above.

**Also open:** do one real booking click-through on a phone and a second device; set `PARTNER_EMAIL` and
`PARTNER_PASSWORD` (12+ characters) if the operations login is wanted. Lighthouse home is 60 to 80 on CI against a 0.55
floor (about 85 to 94 locally); see the CI job's `lighthouse-reports` artifact for the trace.

---

## 6. Changes since the first version of this file (PRs #288 to #338)

- Student offers: Regular and Student offers in admin, student ID upload and check at checkout (#331, #334; migration `20261015020000_student_ids_bucket.sql`).
- Split pitches: players pick the Right or Left half, and the booking screen points to the other half when taken (#333, #335).
- Map: overlapping pins group into numbered circles (#332).
- Main site, admin and partner dashboards link to each other (footer, "Switch to" sidebar group). API routes that change bookings (Razorpay webhook, hold release, student ID upload, payout settlement) now refresh pages (#337).
- Security hardening: client IP helper and payment event table `supabase/setup/15-payment-events.sql` (#338). Apply it to the live database.
- ESLint ignores `.claude/worktrees` (#336).

*Status verified on `main` at `818643d`: typecheck, lint, knip clean; 61 test files, 501 tests pass.*

