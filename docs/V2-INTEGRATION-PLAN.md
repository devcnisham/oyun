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
2. **Read layer** (`src/lib/v2-bookings.ts`): `oyun.bookings` + items + venues to legacy `Booking[]`, plus blocks and active holds. `getDb()` merges them, scoped by venue/player/date window, not all rows.
3. **Write paths onto RPCs**: createBookings (priced), cancel/reschedule, check-in, mark paid, refunds, walk-in, blocks. About 25 call sites in booking/partner/admin actions.
4. **Money**: wallet ledger, promo redemptions, payouts and invoices read `oyun.payments/wallet_ledger/invoices`.
5. **Cutover**: backfill existing bookings, run parity checks on staging, then drop setup step 12 tables.

## Decision needed before phase 2

Players, wallet and promos are still jsonb with text ids; v2 expects uuids. Either map ids deterministically
(as `stringToUuid` does for venues) or migrate players first. Recommendation: deterministic mapping now, migrate later.

Nothing in phases 2 to 5 can be verified without a staging Supabase; use a throwaway local Postgres for SQL, staging for end to end.
