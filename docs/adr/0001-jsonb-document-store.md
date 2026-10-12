# ADR-0001: Store data as jsonb documents in Postgres

Status: Accepted (target replaced by slot booking v2)

## Context
Two-day build, schema still moving, one developer.

## Decision
Fourteen `(id, data jsonb)` tables, with generated columns only where a unique index needs them.

## Trade-off
Fast iteration and one write path. No referential integrity, and a server keeps the whole store in memory.

## Reopen when
Before real traffic, or when a second developer joins. See `docs/SLOT-BOOKING-DB.md` and tasks P10-07, R008.
