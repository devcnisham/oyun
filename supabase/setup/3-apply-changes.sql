-- OYUN database setup, step 3 of 4. Run the steps in order in Supabase → SQL Editor.
-- Paste the WHOLE file, make sure no text is highlighted, then click Run. Safe to run again.

-- Apply one mutation atomically. expected_rev guards against lost updates:
-- if another write landed since the caller loaded the state, nothing is applied
-- and the caller retries on fresh data. Pass null to initialise an empty store.
create or replace function public.apply_changes(changes jsonb, expected_rev bigint)
returns bigint
language plpgsql
set search_path = public
as $$
declare
  t text;
  new_rev bigint;
begin
  if expected_rev is null then
    insert into public.app_meta (id, rev) values (1, 1) on conflict (id) do nothing;
    if not found then
      raise exception 'store_conflict' using errcode = '40001';
    end if;
    new_rev := 1;
  else
    update public.app_meta set rev = rev + 1, updated_at = now()
      where id = 1 and rev = expected_rev
      returning rev into new_rev;
    if new_rev is null then
      raise exception 'store_conflict' using errcode = '40001';
    end if;
  end if;

  foreach t in array array[
    'turfs', 'partners', 'staff', 'players', 'bookings', 'blocks', 'offers',
    'add_ons', 'applications', 'wallet_txns', 'holds', 'promo_codes', 'pricing', 'app_config'
  ] loop
    if changes->'deletes' ? t then
      execute format('delete from public.%I where id in (select jsonb_array_elements_text($1))', t)
        using changes->'deletes'->t;
    end if;
    if changes->'upserts' ? t then
      execute format(
        'insert into public.%I (id, data)
           select r->>''id'', r->''data'' from jsonb_array_elements($1) with ordinality as e(r, n) order by n
         on conflict (id) do update set data = excluded.data, updated_at = now()', t)
        using changes->'upserts'->t;
    end if;
  end loop;
  return new_rev;
end $$;
