# ADR-0002: Global revision lock plus unique indexes

Status: Superseded for slot bookings by Slot Booking v2 (ADR-0010 / migration 20261011000000_slot_booking_v2.sql)

## Context
Double booking is the one failure that breaks trust.

## Decision
`apply_changes` succeeds only when the caller saw the latest revision; partial unique indexes catch anything that slips past.

## Trade-off
Cross-table checks are safe in app code; all writes are serialised, so two turfs can conflict.

## Reopened / Superseded
Resolved in Slot Booking v2: task P10-02 (per-turf version) was superseded by PostgreSQL row-level exclusion constraints (`oyun.exclusion_claims`) and granular row locks, completely eliminating the global revision lock for bookings so separate turfs and courts never conflict.
