# OYUN Incident Response Runbooks

Operational runbooks for on-call engineers, ops staff, and admins. Corresponds to tasks P8-62 (brief B-6.8) and P8-14 (brief B-6.6).

---

## 1. Incident Severity & Immediate Protocol

| Severity | Definition | Target Response | Target Resolution |
|---|---|---|---|
| **SEV-1 (Critical)** | Double booking detected; booking site down; payment webhook pipeline down > 15 mins. | < 15 mins | < 2 hours |
| **SEV-2 (Major)** | Payout batch failure; individual refund failure loop; SMS/notification outage. | < 1 hour | < 6 hours |
| **SEV-3 (Minor)** | Non-blocking admin dashboard bug; partner calendar display glitch. | Next business day | < 3 business days |

All system errors log to Vercel runtime logs and ping `ERROR_WEBHOOK_URL` (`src/modules/shared/backend/monitoring.ts`). Sensitive actions and alerts include the affected `bookingId`, `turfId`, or `partnerId` without logging personal credentials or credit card numbers.

---

## 2. Runbook 1: Payout Failed

**Trigger:** Partner payout transfer fails via payout gateway, or `ERROR_WEBHOOK_URL` logs `payout.failed`.

### Steps:
1. **Hold the funds:**
   - In Admin Console → **Partners** → Select Partner.
   - Set Payout Status to `ON_HOLD` to prevent automated retries from compounding errors.
2. **Diagnose Failure Reason:**
   - Query gateway payout response:
     - `INVALID_ACCOUNT_DETAILS`: Beneficiary IFSC or Account Number invalid.
     - `BENEFICIARY_BANK_OFFLINE`: Destination bank downtime.
     - `LIMIT_EXCEEDED`: Payout gateway balance low or transfer limits reached.
3. **Remediation:**
   - **Low Gateway Balance:** Top up OYUN platform nodal/escrow account and re-trigger payout.
   - **Bank Error:** Contact the partner to verify bank details (PAN, IFSC, Account Number).
   - If invalid bank details, partner updates details in **Partner Settings** → **Bank Accounts**.
4. **Retry:**
   - Trigger single payout retry with identical idempotency key prefix `payout_<partnerId>_<period>_r<attempt>`.
5. **Resolution:**
   - Confirm gateway webhook receives `payout.processed`.
   - Release hold and notify partner via WhatsApp/Email with statement PDF.

---

## 3. Runbook 2: Refund Failed

**Trigger:** Cancellation policy allows refund but payment gateway refund call fails or returns `refund.failed`.

### Steps:
1. **Locate Booking & Transaction:**
   - Obtain `bookingId` from alert or ticket (e.g., `bk_...`).
   - Check payment record for `gatewayPaymentId` and original `amountPaid`.
2. **Check Failure Root Cause:**
   - `INSUFFICIENT_MERCHANT_BALANCE`: Gateway nodal balance insufficient to cover refund.
   - `CHARGE_DISPUTED`: Player opened a bank chargeback; gateway freezes refund.
   - `PAYMENT_EXPIRED`: Original payment > 180 days old (RBI limits on standard UPI refund).
3. **Action:**
   - If balance low: Top up gateway account; click **Retry Refund** in Admin Console → **Bookings** → Details.
   - If UPI/card closed or expired: Admin issues refund as **OYUN Wallet Balance** (`walletBalance += refundAmount`) with player consent, or initiates manual NEFT/IMPS via company bank account.
4. **Audit:**
   - Add note in booking history: `Manual refund processed by admin <id> via <method>`.

---

## 4. Runbook 3: Webhook Down / Gateway Delivery Failures

**Trigger:** Player is charged by bank/UPI, but booking remains in `held` or `pending` status; Gateway reports webhook delivery failures (HTTP 5xx or timeout).

### Steps:
1. **Verify Webhook Endpoint Health:**
   - Test endpoint: `curl -I https://oyun.club/api/webhooks/payment`
   - Inspect Vercel deployments and error logs for uncaught exceptions in webhook signature verification.
2. **Replay Pending Webhooks:**
   - Log into Payment Gateway Dashboard → **Webhooks** → Select endpoint.
   - View failed deliveries in the last 2 hours.
   - Click **Replay Failed Events**.
   - Note: The OYUN webhook handler is strictly idempotent; each `event_id` is recorded in a transaction before state changes.
3. **Manual Reconciliation (If webhooks cannot be delivered):**
   - Run reconciliation script:
     ```bash
     npm run reconcile:payments -- --window=2h
     ```
   - For any orphan payment confirmed by gateway without a confirmed booking:
     - If slot is still free: confirm the booking and send confirmation SMS.
     - If slot was taken by another user during the outage: trigger automatic immediate refund (Runbook 4).

---

## 5. Runbook 4: Double Booking Detected

**Trigger:** Two bookings exist for the same turf, court/resource, date, and time slot. **Target: Must always read 0.**

### Steps:
1. **Immediate Containment (5 minutes):**
   - Identify both bookings: Booking A (first confirmed transaction) and Booking B (conflicting winner).
   - In Postgres:
     ```sql
     select id, data->>'code' as code, data->>'status' as status, created_at
     from public.bookings
     where data->>'turfId' = '<turf_id>'
       and data->>'date' = '<date>'
       and (data->>'hour')::int = <hour>;
     ```
2. **Slot Allocation:**
   - The first confirmed transaction (Booking A) keeps the slot.
3. **Resolution for Second Player (Booking B):**
   - Automatically trigger 100% full refund to original payment source.
   - Issue complimentary ₹200 wallet credit as goodwill apology.
   - Phone call / WhatsApp notification to Player B explaining technical conflict, confirmed refund transaction ID, and offer to rebook an alternative slot or venue.
4. **Root Cause Analysis (RCA):**
   - Inspect `supabase/proposals/slot_booking_v2.sql` exclusion constraints.
   - Verify if global revision lock or exclusion constraint was bypassed during offline partner block.
   - Patch constraint and document in post-mortem.

---

## 6. Runbook 5: Database Backup & Disaster Recovery

**Schedule:** Daily automated backups via Supabase Managed Postgres with 7-day Point-in-Time Recovery (PITR).

### Backup Verification:
- Weekly automated snapshot check to verify database dumps are restorable.

### Emergency Restoration Procedure:
1. **Point-in-Time Recovery (PITR):**
   - In Supabase Dashboard → Project Settings → **Backups** → **Point-in-Time Recovery**.
   - Select timestamp immediately prior to corruption or incident (e.g. `2026-10-14 11:45:00 UTC`).
   - Restore into a temporary staging instance.
2. **Verification on Scratch Database:**
   - Run verification query:
     ```bash
     psql "$STAGING_DATABASE_URL" -c "select count(*) from turfs; select count(*) from bookings;"
     ```
   - Run test suite against scratch instance:
     ```bash
     npm run test:sql
     ```
3. **Promote Staging to Production:**
   - Update Vercel environment variable `DATABASE_URL` and `SUPABASE_URL` to the restored instance.
   - Trigger Vercel redeployment.
   - Run `/api/health` to confirm `storage: supabase`, `bookingsSharedBetweenPlayers: true`, `realtimeSlotUpdates: true`.
