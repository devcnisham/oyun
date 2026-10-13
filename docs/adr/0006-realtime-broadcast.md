# ADR-0006: Supabase Realtime broadcast for slot freshness

Status: Accepted

## Context
A player must see a slot disappear while choosing.

## Decision
After a write the server posts a ping to `slots:{turf}:{date}`; clients refetch through a server action. A 10-second poll is the safety net.

## Trade-off
Cheap and independent of row-level security. Topics are public and carry no data.

## Security Review (P9-15)
Public ping-only channels accepted in writing:
1. Payloads carry zero business data (empty ping `{}` triggering revalidation).
2. All actual slot data is retrieved via authenticated server actions / API endpoints with server validation.
3. No denial of service or eavesdropping risk since topic names only encode turf slug and date (`slots:{turf}:{date}`).

## Reopen when
If a broadcast payload ever carries user or booking data, switch to private channels with authorization tokens.
