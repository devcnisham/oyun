-- OYUN database setup, step 2 of 4. Run the steps in order in Supabase → SQL Editor.
-- Paste the WHOLE file, make sure no text is highlighted, then click Run. Safe to run again.

-- Whole state in one round trip; rows come back in insertion order
create or replace function public.load_state()
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  result jsonb := '{}'::jsonb;
  t text;
  rows jsonb;
begin
  foreach t in array array[
    'turfs', 'partners', 'staff', 'players', 'bookings', 'blocks', 'offers',
    'add_ons', 'applications', 'wallet_txns', 'holds', 'promo_codes', 'pricing', 'app_config'
  ] loop
    execute format(
      'select coalesce(jsonb_agg(jsonb_build_object(''id'', id, ''data'', data) order by seq), ''[]''::jsonb) from public.%I', t)
      into rows;
    result := result || jsonb_build_object(t, rows);
  end loop;
  return result || jsonb_build_object('rev', (select rev from public.app_meta where id = 1));
end $$;
