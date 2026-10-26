# Who may call what

Every server action, API route and dashboard page, with the check that guards it. `src/test/cross-cutting/authorization.test.ts` (admin and partner actions) and `src/test/cross-cutting/authorization-audit.test.ts` (public actions, login, routes, pages) fail when something here is added, removed or loses its guard, so this table cannot drift quietly. Related: `docs/SECURITY.md`, `src/test/cross-cutting/tenant-isolation.test.ts` (owner A cannot touch owner B).

How to read it: **Guard** is what runs before data is touched. **Scope** is what the caller can reach.

## Callers

| Caller | Identified by | Where |
| --- | --- | --- |
| Player (signed in) | Clerk session, when Clerk keys are set | `currentAccountId()` in `booking-actions.ts` |
| Player (anonymous) | httpOnly device cookie (hash stored) and the unguessable `bk_` booking id | `device-holder.ts` |
| Partner owner, manager, front desk | signed httpOnly cookie, role from `partners` or `staff` | `partner-auth.ts` |
| Admin | signed httpOnly cookie, one credential from env | `session.ts`, `requireAdmin()` |

Partner permissions: front desk = bookings, checkin, slots; manager adds pricing, offers, addons, turf; owner adds staff and payouts.

## Public and player actions (`src/modules/web/backend/booking-actions.ts`)

| Action | Guard | Scope |
| --- | --- | --- |
| `getSlotsForDate` | none (public data) | Active turfs only; no personal data |
| `holdSlots` | rate limit 60/IP and 15/device per 10 min; refused when the database is not shared | This device's holds |
| `releaseHolds` | device cookie | Only this device's holds |
| `checkReferralCode` | rate limit 40/IP per 10 min (the answer separates "valid" from "not new") | Reads players |
| `quoteSelection` | rate limit 300/IP; works on a copy of the data | Writes nothing |
| `createBookings` | Clerk sign-in when Clerk is on; validation; rate limit 30/IP and 10/device; refused when not saved | Creates bookings for the caller |
| `cancelMyBooking` | unguessable `bk_` id; rate limit; booking's account must match; 2 hours before the slot | One booking |
| `submitReview` | unguessable `bk_` id; rate limit; account match; only after check-in | One booking |
| `getBookingSummaries` | only ids it is given (unguessable) or the signed-in account's own bookings | Masked fields |
| `submitApplication` | honeypot, minimum fill time, rate limit 5/IP/hour, server validation | Creates a pending application |

Shared rate limits live in Postgres (`supabase/setup/8-rate-limits.sql`) and fall back to per-instance counters until that step is run.

## Login (`src/modules/shared/backend/auth-actions.ts`)

| Action | Guard |
| --- | --- |
| `login(role)` | Lock after 5 failures per role+email+IP or 20 per role+IP for 15 minutes; checked before the password; scrypt hashes; constant-time compares |
| `logout(role)` | Known role only |

## Partner actions (`src/modules/partner/backend/partner-actions.ts`)

Each calls `requirePartnerAction(permission)` before touching data, and scopes every lookup to the caller's turf or partner.

| Permission | Actions |
| --- | --- |
| any partner or staff | `switchTurf` (only to the caller's own turfs) |
| bookings | `createWalkIn`, `cancelBooking`, `getWalkInSlots` |
| checkin | `checkInBooking` (cash confirmation when a balance is due), `markNoShow` |
| slots | `blockSlot`, `unblockSlot`, `setRainOut` (only the signed-in context turf; no turf id is read from the form) |
| pricing | `savePricing` |
| offers | `createOffer`, `toggleOffer`, `deleteOffer` |
| addons | `saveAddOn`, `toggleAddOn`, `deleteAddOn` |
| staff | `createStaff`, `resetStaffPassword`, `deleteStaff` |
| turf | `updateTurfProfile` |
| payouts | `updateBusiness` |

## Admin actions (`src/modules/admin/backend/admin-actions.ts`)

Every exported action calls `requireAdmin()` before touching data: approve and reject applications, update turfs and partners, suspend and reset partners, ban players, adjust wallets, refund bookings, save settings, declare or clear a city-wide rain day (`setRainDay`), promo codes, site content, promo cards and sponsor ads.

## API and file routes

| Route | Guard |
| --- | --- |
| `GET /api/health` | None; returns yes/no flags only, never keys or data |
| `POST /api/client-error` | Shared rate limit 20/IP/min; 5 KB body cap; no cookies or headers logged |
| `POST /api/holds/release` | Same-origin check; releases only the caller's device holds |
| `GET /api/privacy/export` | Signed-in Clerk account only (401 otherwise); data is found by that account id, never by a phone in the request; 10/account/min |
| `POST /api/privacy/delete` | Same-origin check plus signed-in Clerk account only (401 otherwise); erases only that account's records; 5/account/min |
| `POST /api/student-id` | Same-origin check; 10/IP/hour and 5/phone/hour; JPEG, PNG or WebP up to 5 MB; a number tied to a signed-in account can only send from that account; stored in a private bucket, never a public URL |
| `GET /api/admin/student-id/[playerId]` | Admin session only; serves the photo of a pending ID, `no-store` |
| `GET /bookings/[id]/calendar` | Unguessable booking id (capability link); no phone number |
| `GET /partner/payouts/export` | Partner session with the `payouts` permission |
| `POST /api/webhooks/razorpay` | HMAC SHA256 signature verification, shared rate limit 120/IP/min |
| `GET /api/monitoring/double-bookings` | Shared rate limit 60/IP/min; monitors live double bookings and triggers SEV-1 paging |

## Pages

| Area | Guard |
| --- | --- |
| `/admin/*` | `proxy.ts` cookie check, then `admin/(dashboard)/layout.tsx` verifies the admin session; only `/admin/login` is outside |
| `/partner/*` | `proxy.ts` cookie check, then `requirePartner()` in the layout; each page asks for its permission (table in the audit test); the calendar needs `bookings` |
| Player pages | `/bookings`, `/profile`, `/saved`, `/settings` read the signed-in account or device data; ticket and invoice pages are capability links by booking id with the phone masked |

## Known gaps

Cancelling or reviewing an anonymous ticket needs the booking phone number as well as the unguessable id (P9-05); wallet and booking identity still trust a typed phone number without Clerk (P9-03); admin is one credential with no MFA (P9-09). See `docs/SECURITY.md`.
