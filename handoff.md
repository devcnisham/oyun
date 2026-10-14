# Project Handoff & Status Report: OYUN Arena Platform

**Timestamp:** 2026-10-15  
**Current Git Branch:** `main`  
**Current Head Commit:** `645a965` (merged PRs #187 to #287 on `origin/main`)  
**Working Tree Status:** Clean, zero uncommitted changes  

---

## 1. Quality & Verification Health Check

All automated verification gates are passing with 100% success on `main`:

| Verification Suite | Command | Result | Details |
|---|---|---|---|
| **Unit Tests** | `npm test` | **PASS** | 53 test files, 430 tests passing (100%) |
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
   - `RETIRED_JSONB_TABLES` in `src/lib/store.ts` ignores bookings/holds/blocks/pricing during `diff`, avoiding `apply_changes` invocation, global revision lock conflicts (`40001`), and server synchronization overhead.
   - Added database migration `supabase/migrations/20261013000000_retire_jsonb_bookings.sql` and setup script `supabase/setup/11-retire-jsonb-bookings.sql` to filter `load_changes` and `load_state`.
   - Added test `supabase/tests/retire_jsonb_bookings_test.sql` wired into `scripts/sql-tests.sh`.
   - Realtime slot change broadcasting remains 100% active via full-snapshot inspection in `changedSlotDays(before, db)`.

2. **R010: One Order Per Checkout for Multi-Hour Bookings** (`3f42928`)
   - Added `BookingItem` and `items?: BookingItem[]`, `hours?: number[]` to `Booking`.
   - Multi-hour checkouts generate a single unified `Booking` order with itemized slots, one check-in code/QR, and one payment/invoice breakdown.
   - Updated slot occupancy logic in `src/lib/pricing.ts`, `src/lib/calendar.ts`, and partner slot management.
   - Updated `Invoice.tsx` to render itemized breakdown lines.

3. **Switch Slots Over to Database v2 RPCs** (`2fc690b`)
   - Created `src/lib/slot-booking-v2.ts` with RFC 4122 v4 deterministic UUID mapping (`stringToUuid`, `turfBookableUuid`).
   - Implemented public wrappers: `v2AvailableSlots`, `v2HoldSlots`, `v2ConfirmHold`, `v2CancelBooking`, `v2BlockSlot`, and `v2ExpireHolds`.
   - Wired v2 RPCs into server actions: `getSlotsForDate`, `holdSlots`, `createBookings`, `cancelMyBooking`, `createWalkIn`, `blockSlot`.

4. **R009: Any Slot Length and After-Midnight Slots** (`2491794`)
   - Support for slots past midnight (e.g. 00:00–02:00 up to 06:00) using modulo arithmetic normalization in `src/lib/format.ts`, `src/lib/time.ts`, and `src/lib/pricing.ts`.
   - Variable slot durations (30 min pickleball, 60 min football, 90 min matches).
   - Late-night session badge `🦉` (hours 24..30) in arena booking flows.
   - Early morning check-in window offset (`now.hour + 24`) in `src/lib/checkin-window.ts`.
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
   - Full test coverage in `src/lib/calendar.test.ts`.

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

## 3. Remaining Work Breakdown

### Phase 2: Database v2 & Final Cutover
- [ ] **P10-06 pg_cron Hold Expiry (GATE)**
  - Script prepared: `supabase/setup/12-cron-expire-holds.sql`
  - Requires: Running in production Supabase SQL Editor once user enables `pg_cron` extension.
- [ ] **P10-02 Per-Turf Version Lock**
  - Superseded by Database v2 row-level resource locks and exclusion constraints (`slot_claims_no_overlap`). Documented in `docs/adr/0002-global-revision-lock.md`.
- [ ] **Relational Migration for Remaining Entities (GATE)**
  - Move partners, staff, players, reviews, promo codes, add-ons, site config off JSONB store into relational tables once user confirms production freeze.

### Phase 3: Payments & Financial Ledger (R014)
> **HARD GATE:** Requires user-provided Razorpay credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`).
- [ ] **P11-01: Razorpay Order Creation & Signature Verification**
  - Server-side Razorpay order generation during checkout (`confirm_hold(..., pay_online => true)`).
  - Client-side checkout modal with Razorpay SDK (zero card data stored on OYUN servers).
- [ ] **P11-02: Idempotent Webhook Handler**
  - `/api/webhooks/razorpay` validating `X-Razorpay-Signature`.
  - Event deduplication in `payment_events` table before invoking `confirm_payment`.
  - Handle `refund_needed` if a late payment arrives after hold expired.
- [ ] **P11-03: Advance & Full Payment Modes**
  - Dynamic advance deposit (percentage within ₹min–max bounds) vs full online payment.
- [ ] **P11-04: Gateway Automated Refunds**
  - Trigger Razorpay Refund API when a player cancels within free cancellation window.
- [ ] **R013: Wallet Ledger Database View**
  - Make `wallet_ledger` view the single source of truth for player balances.
- [ ] **Partner Payouts & Invoicing**
  - Automated partner payout calculation (net of platform commission and GST).
  - Monthly GST invoice generation for venue owners.
- [ ] **P11-05: Nightly Reconciliation Job**
  - Cron script matching bank/Razorpay ledger against completed bookings.

### Phase 4: Media & Image Optimization
> **GATE:** Requires Supabase Storage bucket (`turf-images`) setup.
- [ ] **P10-09: Next/Image Loader & WebP Pipeline**
  - Configure Supabase Storage image transformation and responsive srcset generation.

### Phase 5: Player & Partner Booking Features
- [ ] **Automated Notifications (GATE)**
  - Requires user decision on SMS / WhatsApp provider (e.g. Twilio, Gupshup, Aisensy).
  - P12-01: Instant WhatsApp/SMS booking confirmation with Google Maps directions link.
  - P12-02: Reminder alert 2 hours before the slot.
  - P12-03: Real-time owner alert on new booking.
  - P12-04: Email booking receipt.
  - P12-05: Web Push notifications.
- [ ] **P13-04: Search Filters & Map View (GATE)**
  - Search by sport, area/neighborhood, date/time window, price range, and amenities.
  - Requires user choice between Google Maps JavaScript API vs Mapbox GL JS for interactive map pins.
- [ ] **P13-06: Waitlist & Recurring Bookings**
  - Player waitlist when a popular prime-time slot is booked; automated notification if cancelled.
  - Recurring weekly team bookings with conflict checks.
- [ ] **Split Payment Link**
  - Generate shareable UPI / payment link for split bills among team members.
- [ ] **P13-01: Open Matches & "Find Players"**
  - Host open games, allow individual players to join squads and fill vacant spots.
- [ ] **P13-02: Tournament Bracket Engine**
  - Knockout and round-robin tournament manager for local Mangalore cups.
- [ ] **P13-03: Weather Alerts**
  - Rain warning for outdoor turf bookings using OpenWeather / IMD API.
- [ ] **P13-05: Admin Platform Analytics**
  - GMV, arena utilization rates, cancellation rates, and peak time heatmaps.
- [ ] **P13-07: Kannada Language Support**
  - Localization for UI text and booking confirmation messages.

### Phase 6 & 7: Quality, Compliance & Launch
- [ ] **Concurrency Race Test in CI**
  - Parallel Playwright/HTTP sessions attempting simultaneous double-bookings on a single court.
- [ ] **Accessibility (a11y) Audit**
  - Automated `axe-core` test run verifying 100% WCAG 2.1 AA compliance across all routes.
- [ ] **Lighthouse 90+ Score Optimization**
  - Core Web Vitals audit (LCP < 2.5s, FID/INP < 200ms, CLS < 0.1).
- [ ] **DPDP Act (Digital Personal Data Protection) Compliance**
  - Self-serve data export ("Download my data").
  - Account deletion ("Delete my profile and erase PII").
  - Automated data retention purge script for inactive guests.

---

## 4. Pending External GATES (Decisions Needed from User)

When you are ready to resume, the following external accounts/credentials will be needed to unblock subsequent phases:

1. **Razorpay Account Credentials** (for Phase 3: Payments):
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
2. **Notification Provider** (for Phase 5: Notifications):
   - Choice between **WhatsApp Business API** (e.g. Gupshup, Meta Cloud API) or **Transactional SMS** (e.g. Twilio, MSG91).
3. **Map Provider** (for Phase 5: Search Map View):
   - Choice between **Google Maps API** or **Mapbox Token**.
4. **Supabase Production Actions**:
   - Run `supabase/setup/12-cron-expire-holds.sql` in Supabase SQL Editor once `pg_cron` is enabled.
   - Create public storage bucket `turf-images`.

---

## 5. Immediate Next Steps for Resumption

When you return to continue development, follow this sequence:

1. **If external credentials ARE NOT ready yet**:
   - Implement **P13-04 Search Filters** (sport, price, area, amenities) on `/arenas`.
   - Implement **P13-06 Waitlist Engine** for full slots.
   - Implement **P13-01 "Find Players" / Open Matches** community board.
   - Implement **P13-07 Kannada (kn) localization** toggles.
2. **If Razorpay credentials ARE ready**:
   - Create branch `claude/phase3-razorpay-payments`.
   - Implement `src/lib/payments.ts` and checkout flow with Razorpay Webhook handler.
   - Wire `confirm_payment` RPC and refund endpoints.

---
*Generated automatically by Antigravity AI assistant. Ready for instant resumption.*
