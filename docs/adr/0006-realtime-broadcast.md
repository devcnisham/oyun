# ADR-0006: Supabase Realtime broadcast for slot freshness

Status: Accepted

## Context
A player must see a slot disappear while choosing.

## Decision
After a write the server posts a ping to `slots:{turf}:{date}`; clients refetch through a server action. A 10-second poll is the safety net.

## Trade-off
Cheap and independent of row-level security. Topics are public and carry no data.

## Reopen when
If a ping ever carries data, switch to private channels.

## Security Review & Decision (Task P9-15)
Formalized on 2026-10-15:
Confirmed and accepted in writing that broadcast topics (`slots:{turf}:{date}`) carry strictly anonymous, ephemeral cache-invalidation signals without customer identities, booking IDs, phone numbers, or payment tokens. All booking state is subsequently loaded through server actions with session and device checks. Public broadcast channels are accepted as secure, low-latency, and zero-leakage for slot freshness.

