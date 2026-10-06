-- OYUN database setup, step 4 of 4. Run the steps in order in Supabase → SQL Editor.
-- Paste the WHOLE file, make sure no text is highlighted, then click Run. Safe to run again.

-- Wipe everything; the app starts again from the launch data on its next load.
-- Only used by supabase/reset-before-launch.sql.
create or replace function public.reset_state()
returns void
language plpgsql
set search_path = public
as $$
begin
  truncate public.turfs, public.partners, public.staff, public.players, public.bookings,
    public.blocks, public.offers, public.add_ons, public.applications, public.wallet_txns, public.holds,
    public.promo_codes, public.pricing, public.app_config, public.app_meta restart identity;
end $$;

-- Server only: the secret key maps to service_role
revoke all on function public.load_state() from public, anon, authenticated;
revoke all on function public.apply_changes(jsonb, bigint) from public, anon, authenticated;
revoke all on function public.reset_state() from public, anon, authenticated;
grant execute on function public.load_state() to service_role;
grant execute on function public.apply_changes(jsonb, bigint) to service_role;
grant execute on function public.reset_state() to service_role;
