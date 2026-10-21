-- OYUN database setup, step 12: Retire legacy jsonb tables (Issue #142)
-- Drops the old deprecated tables replaced by the typed relational schema 'oyun'.
-- DO NOT RUN while OYUN_V2_SLOTS is off: the live store still saves bookings, holds, blocks and pricing in
-- these tables, and load_state/load_changes read them. Run only after v2 slots are the source of truth.
-- Safe to re-run.

drop table if exists public.holds cascade;
drop table if exists public.blocks cascade;
drop table if exists public.bookings cascade;
drop table if exists public.pricing cascade;
