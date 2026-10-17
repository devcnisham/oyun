# Refund and commission policy (DRAFT; reflects how the product works today)

Facts below come from the code (`src/lib/cancel-policy.ts`, `src/lib/pricing.ts`, `src/lib/payouts.ts`, `src/lib/seed.ts`) and the live Terms page. Anything in `[BRACKETS]` is a decision for the owner.

## Players: cancellations and refunds
| Situation | What happens |
|---|---|
| Player cancels at least 2 hours before the slot | 100% of the advance and any wallet amount used go back to the **OYUN wallet** immediately. |
| Player cancels within 2 hours | Self-cancel is closed; contact the turf or support. `[Decide: any partial refund?]` |
| Open outdoor turf, unplayable rain or waterlogging | 100% wallet refund until the slot starts (Monsoon guarantee). Admin can declare city-wide rain days. |
| Turf cancels or cannot host | 100% wallet refund; support helps rebook. |
| No-show | Marked no-show; no refund; repeat no-shows can lead to blocking. |
| Promo codes | A code is not given back on cancel, so cancel-and-rebook cannot reuse it. |

Refunds go to the **wallet**, not the original payment method. `[LAWYER: confirm this is allowed and how to word it; payment-gateway and RBI rules may require a refund to source on request.]` Wallet credits have no cash value and can only be used on OYUN (Terms section 3).

## Advance and balance
- The advance per booked hour is **10%, never below ₹150 or above ₹150 by default**, and never above that hour's price (platform settings `advancePercent`, `minAdvance`, `maxAdvance`). The rest is paid to the turf at the venue.

## Commission
- Platform default **0%** today (`commissionPercent`); an admin can set a different rate per turf. `[OWNER: the launch rate]`
- GST: **18%** on the commission. Invoices are generated per booking and per payout statement.

## Payouts to turf owners
- Online money collected is settled on a **T+2** basis (booking day plus two days), net of commission and GST on commission, with a statement per payout.
- A payout can be `on_hold` (dispute, suspected fraud). `[OWNER: dispute and chargeback process]`

## Gaps to settle with the reviewer
1. Refund to source versus wallet-only.
2. Who bears gateway fees on refunded bookings.
3. No-show money: kept by the turf, shared, or refunded.
4. TCS/TDS and invoicing between OYUN, the turf and the player.
5. A cap or schedule for partial refunds inside the 2-hour window, if wanted.
