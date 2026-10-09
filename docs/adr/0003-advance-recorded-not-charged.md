# ADR-0003: A flat advance is recorded; nothing is charged online yet

Status: Accepted until Razorpay

## Context
No payment gateway yet, but owners want a commitment before holding a slot.

## Decision
Each booked hour asks an advance of `advancePercent` of its price, kept between `minAdvance` and `maxAdvance` (both 150 rupees by default), paid at the turf. The wallet is internal credit only.

## Trade-off
A commitment signal and a path to Razorpay. Until the gateway exists the advance is bookkeeping, so a refund must only return wallet money really paid in (`refundDue()`).

## Reopen when
When Razorpay is added (P11), or when no-shows still hurt owners.
