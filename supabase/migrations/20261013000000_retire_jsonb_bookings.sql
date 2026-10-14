-- Retire the jsonb store for bookings, holds, blocks, pricing (Task R008)
-- In Database v2, slots and bookings are managed via oyun schema tables (venues, resources,
-- bookables, bookings, booking_items, slot_claims).
-- load_changes and load_state exclude bookings, holds, blocks, and pricing to avoid
-- loading historical jsonb booking data into server memory on every sync.
-- Safe to re-run.

-- 1. Update load_changes to exclude retired tables from upserts and tombstones
create or replace function public.load_changes(since bigint)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  cur bigint;
  floor_rev bigint;
  upserts jsonb := '{}'::jsonb;
  deletes jsonb;
  t text;
  rows jsonb;
begin
  select rev, delta_from into cur, floor_rev from public.app_meta where id = 1;
  if cur is null or since is null or since < floor_rev or since > cur then
    return public.load_state() || jsonb_build_object('full', true);
  end if;
  if since = cur then
    return jsonb_build_object('rev', cur, 'full', false);
  end if;

  -- Active jsonb tables (bookings, holds, blocks, pricing retired)
  foreach t in array array[
    'turfs', 'partners', 'staff', 'players', 'offers',
    'add_ons', 'applications', 'wallet_txns', 'promo_codes', 'app_config'
  ] loop
    execute format(
      'select coalesce(jsonb_agg(jsonb_build_object(''id'', id, ''data'', data) order by seq), ''[]''::jsonb) from public.%I where rev > $1', t)
      into rows using since;
    if rows <> '[]'::jsonb then
      upserts := upserts || jsonb_build_object(t, rows);
    end if;
  end loop;

  select coalesce(jsonb_object_agg(tbl, ids), '{}'::jsonb) into deletes
    from (
      select tbl, jsonb_agg(id) as ids
      from public.deleted_rows
      where rev > since
        and tbl not in ('bookings', 'holds', 'blocks', 'pricing')
      group by tbl
    ) d;

  return jsonb_build_object('rev', cur, 'full', false, 'upserts', upserts, 'deletes', deletes);
end $$;

-- 2. Update load_state to omit retired tables (return empty json arrays)
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
    'turfs', 'partners', 'staff', 'players', 'offers',
    'add_ons', 'applications', 'wallet_txns', 'promo_codes', 'app_config'
  ] loop
    execute format(
      'select coalesce(jsonb_agg(jsonb_build_object(''id'', id, ''data'', data) order by seq), ''[]''::jsonb) from public.%I', t)
      into rows;
    result := result || jsonb_build_object(t, rows);
  end loop;

  -- Retired tables return empty json arrays to keep memory clean
  result := result || jsonb_build_object(
    'bookings', '[]'::jsonb,
    'holds', '[]'::jsonb,
    'blocks', '[]'::jsonb,
    'pricing', '[]'::jsonb
  );

  return result || jsonb_build_object('rev', (select rev from public.app_meta where id = 1));
end $$;

-- 3. Maintain permissions
revoke all on function public.load_changes(bigint) from public, anon, authenticated;
grant execute on function public.load_changes(bigint) to service_role;
revoke all on function public.load_state() from public, anon, authenticated;
grant execute on function public.load_state() to service_role;
