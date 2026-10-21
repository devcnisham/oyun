# v2 slot integration plan

Goal: make `oyun.*` the source of truth for bookings, holds, blocks and pricing (flag `OYUN_V2_SLOTS=1`),
with every existing feature working. Today only slot hold/confirm/cancel/block use it (`src/lib/v2-slots.ts`).

## Gap: what the app stores per booking that `oyun.bookings` cannot hold

| Legacy `Booking` field | v2 today | Needed |
|---|---|---|
| `turfId`, `date`, `hour`, `hours`, `items`, `timeLabel`, `durationMinutes`, `startMinute`, `pitch` | `venue_id` + `booking_items.during` + bookable | derive on read (venue slug, IST date/hour from `during`, half from bookable) |
| `customerName/Phone`, `playerId`, `source`, `createdBy` | present (`player_id` is a uuid, legacy ids are text) | id mapping for players (players are still jsonb) |
| `pricing` (promo, wallet, add-ons, GST, cashback) | `price_breakdown` jsonb, `discount`, `wallet_used` | `confirm_hold` must accept the priced quote; it only takes name and phone |
| `addOns`, `paymentMode`, `cashCollected`, `cashback`, `accountId` | none | new columns or `meta jsonb` |
| `review`, `rescheduledAt`, `originalSlot`, `recurringGroupId/Week`, `cancelReason` | partial (`cancel_reason`) | `meta jsonb` + reschedule RPC |

## Phases (each its own PR, each shippable behind the flag)

1. **Schema**: `oyun.bookings.meta jsonb`, `confirm_hold(..., p_quote jsonb)` storing price, wallet use, add-ons, payment mode. SQL tests.
2. **Read layer, done in this PR** (`src/lib/v2-bookings.ts`, overlay in `store.ts`): `oyun.bookings` + items + venues to legacy `Booking[]`, plus blocks and active holds. `getDb()` merges them, scoped by venue/player/date window, not all rows.
3. **Write paths onto RPCs**: createBookings (priced), cancel/reschedule, check-in, mark paid, refunds, walk-in, blocks. About 25 call sites in booking/partner/admin actions.
4. **Money**: wallet ledger, promo redemptions, payouts and invoices read `oyun.payments/wallet_ledger/invoices`.
5. **Cutover**: backfill existing bookings, run parity checks on staging, then drop setup step 12 tables.

## Decision needed before phase 2

Players, wallet and promos are still jsonb with text ids; v2 expects uuids. Either map ids deterministically
(as `stringToUuid` does for venues) or migrate players first. Recommendation: deterministic mapping now, migrate later.

Nothing in phases 2 to 5 can be verified without a staging Supabase; use a throwaway local Postgres for SQL, staging for end to end.

## Phase 2 notes

- `getDb()` and `mutate()` overlay `bookings`, `holds` and `blocks` read from `oyun` when the flag is on (2 s per-server cache, dropped by every v2 write).
- Window: bookings created in the last 90 days and live holds. Older history needs a ranged query (reports, payouts: phase 4).
- Not covered yet: `pricing` is still excluded from the store when the flag is on, so price rules must move to `oyun.price_rules` reads in phase 3 before the flag can be switched on.
- Bookings made by the legacy path while the flag is on are not saved (phase 3 routes them to `confirm_hold_priced`). Do not enable the flag in production before phase 3.

## Phase 3 notes (writes)

Done: checkout (`v2-checkout.ts`: price, confirm the hold with the quote, then wallet/promo/player), edits to existing bookings written back
through `apply_booking_updates` (check-in, no-show, cash collected, cancel, refund, review, cashback), walk-ins (whole-hour slots), block, bulk block, unblock.
Pricing rules stay in the main store (only bookings, holds and blocks move).

Refused loudly while the flag is on (nothing is silently lost): recurring bookings (`recurring.ts` adds bookings), rescheduling (moving a
booking to another slot), walk-ins with custom minutes or lengths, waitlist auto-booking. Each needs a slot-changing RPC; do them before enabling the flag.
Also open: DPDP erase of bookings, payouts and invoices from `oyun.payments` (phase 4), parity check on staging (phase 5).
