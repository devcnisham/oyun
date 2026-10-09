# ADR-0007: Delta sync instead of loading everything per request

Status: Accepted

## Context
Every request downloaded every table; at 1,000 users that was an estimated 100+ GB a month of database egress.

## Decision
Each server keeps the store in memory and calls `load_changes(since)` for rows written after its revision; deletions leave tombstones. Writes still use `apply_changes` with the revision check.

## Trade-off
Tiny reads and no API change for 30+ pages. A cold start still loads everything and memory grows with history.

## Reopen when
When a cold-start load passes about 5 MB, or more than a few servers run at once (task P10-14).
