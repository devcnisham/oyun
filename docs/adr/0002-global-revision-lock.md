# ADR-0002: Global revision lock plus unique indexes

Status: Accepted

## Context
Double booking is the one failure that breaks trust.

## Decision
`apply_changes` succeeds only when the caller saw the latest revision; partial unique indexes catch anything that slips past.

## Trade-off
Cross-table checks are safe in app code; all writes are serialised, so two turfs can conflict.

## Reopen when
When `store_conflict` retries show up in logs, or two owners edit at the same time (task P10-02).
