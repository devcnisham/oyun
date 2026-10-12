# ADR-0006: Supabase Realtime broadcast for slot freshness

Status: Accepted

## Context
A player must see a slot disappear while choosing.

## Decision
After a write the server posts a ping to `slots:{turf}:{date}`; clients refetch through a server action. A 10-second poll is the safety net.

## Trade-off
Cheap and independent of row-level security. Topics are public and carry no data.

## Reopen when
If a ping ever carries data, switch to private channels (task P9-15).
