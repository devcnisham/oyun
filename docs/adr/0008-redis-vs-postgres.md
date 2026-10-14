# ADR-0008: Keep Postgres for holds, availability cache, and rate limits

Status: Accepted (brief B-2.3, task P10-17)

## Context
The system brief (Section 0 and Tier 2) suggests Redis for 10-minute slot holds, availability caching, and distributed rate limiting.

In the current architecture:
1. Rate limits are stored in Postgres table `public.rate_limit_buckets` with transactional atomic increments and sliding windows (`src/lib/shared-rate-limit.ts`).
2. Slot holds are validated with transactional locks and Postgres exclusion constraints (`supabase/proposals/slot_booking_v2.sql`).
3. Availability invalidation uses Supabase Realtime broadcast channels (`src/lib/client/use-slot-updates.ts`) so connected browsers invalidate immediately upon hold or booking without polling.
4. Target market profile: Mangalore sports turfs (~50 venues, peak traffic of ~200-500 concurrent users during evening rush hours).

## Decision
Keep Postgres as the single source of truth for holds, availability, and rate limits at launch. Do not provision a separate Redis / Valkey / Upstash cluster.

## Trade-off
- **Benefits:** Zero distributed consistency bugs (no two-phase commits or split-brain between Redis and Postgres), reduced monthly infrastructure cost ($0 on Supabase Pro vs separate managed Redis cluster), simplified backup/restore runbook, and single connection topology.
- **Costs:** Postgres handles rate-limit and hold write spikes. An unlogged table or periodic table cleanup (`delete from rate_limit_buckets where reset_at < now()`) is needed to avoid table bloat.

## Reopen when
Reopen and provision Redis when any of the following metrics are breached in staging load tests or production monitoring:
1. Rate limit or hold write throughput exceeds 500 QPS sustainably.
2. Slot availability p99 read latency on Postgres exceeds 50 ms under peak load (`scripts/k6/browse.js` with >= 500 VUs).
3. Postgres connection pool utilization reaches >80% primarily due to short-lived cache/rate-limit transactions.
