# OYUN Arena - Feature List

What is built, what is partly built and what is still to do. Updated 9 Oct 2026 (main after PR #71). Detail and task ids live in `docs/build-tracker.html`; the order of work is in `docs/TASK-WORKFLOW.md`.

### 1. Backend & Database
*Status: Working, with known limits*
- [x] Supabase Postgres behind the service-role key (14 jsonb document tables, migrations in `supabase/migrations/`). Local fallback to `.data/db.json` when no key is set.
- [x] Real-time slot updates through Supabase Realtime broadcast.
- [x] Double-booking guard: partial unique indexes plus optimistic revision check.
- [x] Slot holds (8 minutes, per device), released on expiry or tab close.
- [x] Launch checks in `/api/health` and a blocking admin banner when production storage is not Supabase.
- [ ] Typed tables, foreign keys and per-turf locking (slot booking DB v2, see `docs/SLOT-BOOKING-DB.md`).

### 2. User Authentication & "My Bookings"
*Status: Working; identity is weak without Clerk*
- [x] Player sign-in and sign-up through Clerk, with a device name-and-phone fallback when Clerk is not configured.
- [x] Profile, saved turfs, and a My Bookings area with ticket, QR code, invoice and calendar file.
- [x] Self-cancel until 2 hours before the slot.
- [x] Reschedule a booking.
- [x] Bind wallet and booking identity to the signed-in account (today a typed phone number is trusted).

### 3. Real Payment Gateway
*Status: Not started (advance is recorded, not charged)*
- [x] Flat advance per hour (10% of the hour's price, never under or over the configured min and max); the rest is paid at the venue.
- [x] Razorpay signature check, idempotent webhook, and automatic race-lost refund hook (#204).
- [ ] Razorpay order creation (waiting on owner account keys).
- [ ] Gateway refunds tied to cancellation and admin refunds.
- [x] Payout and commission reconciliation against settlements (src/modules/shared/lib/payouts.ts, #169, P11-08).

### 4. Partner / Turf Owner Dashboard
*Status: Mostly complete*
- [x] Owner dashboard with turf details, images, pricing rules, offers, add-ons and staff roles.
- [x] Manual slot blocking and walk-in bookings.
- [x] Check-in desk with QR scan and no-show marking.
- [x] Revenue, payouts and invoices, with a payouts CSV.
- [x] Week calendar across the day's hours, with each half of a split pitch (`/partner/calendar`); day detail and blocking stay on Manage Slots.

### 5. Search, Map View & Filters
*Status: Basic*
- [x] Browse turfs, filter by area and sport, area landing pages (`/turfs/[area]`).
- [ ] Interactive map.
- [ ] Filters for price range, date and time, and amenities.

### 6. Reviews & Rating System
*Status: Complete*
- [x] One review per booking, allowed after check-in.
- [x] Aggregate star ratings and text reviews on turf pages.
- [x] Owner and admin review screens.
- [ ] Ban abusive users.

### 7. Notification System (SMS/WhatsApp/Email)
*Status: Not started*
- [x] Share booking to WhatsApp (a link the player sends, not an automated message).
- [ ] Automated booking confirmation with Google Maps directions.
- [ ] Reminder 2 hours before the slot.
- [ ] Owner alert on new booking and cancellation.
- [ ] Email receipts.

### 8. Digital Wallet & Promo Engine
*Status: Working on the document store; needs hardening*
- [x] Wallet credits from referrals and cashback, spent at checkout (server side).
- [x] Promo codes validated and applied on the server.
- [x] Referral program: wallet credit for the referrer and the new user.
- [ ] Promo limits: expiry, maximum uses, per-player limit.
- [ ] Wallet as a ledger with a database rule that the balance never goes below zero.

### 9. Player Experience Extras
*Status: Partly done*
- [x] Favourites (saved turfs).
- [x] Add to calendar and share to WhatsApp after booking.
- [x] Book again in one tap.
- [x] Split payment link for teammates.
- [ ] Find players / open matches.
- [ ] Recurring weekly bookings.
- [ ] Waitlist for full slots.
- [x] Weather alerts and a rain cancellation policy.
- [ ] Teams and tournaments.

### 10. Advanced Partner Tools
*Status: Complete on the document store*
- [x] Dynamic pricing: peak, weekend and last-minute discounts.
- [x] QR check-in and no-show tracking.
- [x] Owner offers: happy hours and first-time-player discounts.
- [x] Staff accounts with roles (owner, manager, front desk).
- [x] Payout reports and GST invoices.
- [x] Add-ons at checkout (equipment rental, drinks).

### 11. Admin Operations
*Status: Mostly complete*
- [x] Turf verification: approve or reject listings and grant the verified badge.
- [x] Refunds and disputes queue.
- [x] Commission settings per turf.
- [x] Customization: sponsor strip managed by admin (empty by default).
- [x] Review moderation screen.
- [x] Analytics: bookings by area, busiest hours, conversion (/admin/analytics, src/modules/admin/database/analytics.ts, P13-05).
- [ ] Per-user admin accounts, MFA and session revocation (single env credential today).

### 12. Platform & Growth
*Status: Partly done*
- [x] Multi-sport: football, box cricket, badminton and pickleball; site wording is sport-neutral.
- [x] Installable web app manifest and icons.
- [x] SEO: sitemap, robots, structured data, Open Graph images, area landing pages.
- [x] Cookie consent, privacy policy and terms.
- [x] Service worker and push notifications.
- [x] Kannada, Tulu and Hindi versions of the site.

### 13. Quality & Security
*Status: In progress*
- [x] CI on every PR: lint, type-check, unit tests, build and SQL tests.
- [x] Vitest unit tests for pricing, cancel policy, wallet and validation.
- [x] Security headers, client-error webhook, rate limits on login, holds and applications.
- [ ] End-to-end tests for the critical flows.
- [ ] Shared (database) rate limiting, since the current limiter is per server instance.
- [ ] Authorization test for every admin and partner action.
- [ ] Backups runbook and uptime monitoring.

---

### Suggested Build Order
See `docs/TASK-WORKFLOW.md`. In short: security fixes, slot booking DB v2, Razorpay payments, notifications, then player extras (split payment, find players).

---

*Note: Check off boxes (`[x]`) as features are implemented.*
