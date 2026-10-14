-- OYUN database setup, step 12: Retire legacy jsonb tables (Issue #142)
-- Drops the old deprecated tables replaced by the typed relational schema 'oyun'.
-- Safe to re-run.

drop table if exists public.holds cascade;
drop table if exists public.blocks cascade;
drop table if exists public.bookings cascade;
drop table if exists public.pricing cascade;
