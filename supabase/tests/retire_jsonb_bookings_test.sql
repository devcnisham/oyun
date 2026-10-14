-- Tests for R008: JSONB store retirement for bookings, holds, blocks, pricing
\set ON_ERROR_STOP 1
set client_min_messages = warning;

do $$
declare
  v_state jsonb;
  v_changes jsonb;
  v_rev bigint;
begin
  -- 1. load_state returns empty arrays for retired tables
  v_state := public.load_state();
  if v_state->'bookings' <> '[]'::jsonb then
    raise exception 'Expected load_state() to return empty bookings array, got %', v_state->'bookings';
  end if;
  if v_state->'holds' <> '[]'::jsonb then
    raise exception 'Expected load_state() to return empty holds array, got %', v_state->'holds';
  end if;
  if v_state->'blocks' <> '[]'::jsonb then
    raise exception 'Expected load_state() to return empty blocks array, got %', v_state->'blocks';
  end if;
  if v_state->'pricing' <> '[]'::jsonb then
    raise exception 'Expected load_state() to return empty pricing array, got %', v_state->'pricing';
  end if;

  -- 2. load_changes does not return rows for retired tables
  select rev into v_rev from public.app_meta where id = 1;

  -- Add a row to a retired table and an active table with new rev
  insert into public.players (id, data, rev)
    values ('pl_test_retire', '{"name":"Retire Tester"}'::jsonb, v_rev + 10)
    on conflict (id) do update set rev = v_rev + 10;
  insert into public.bookings (id, data, rev)
    values ('bk_test_retire', '{"turfId":"turf_test"}'::jsonb, v_rev + 10)
    on conflict (id) do update set rev = v_rev + 10;
  insert into public.deleted_rows (tbl, id, rev)
    values ('bookings', 'bk_deleted_test', v_rev + 10)
    on conflict (tbl, id) do update set rev = v_rev + 10;
  insert into public.deleted_rows (tbl, id, rev)
    values ('players', 'pl_deleted_test', v_rev + 10)
    on conflict (tbl, id) do update set rev = v_rev + 10;

  v_changes := public.load_changes(v_rev);

  -- Players should be in upserts and deletes
  if not (v_changes->'upserts' ? 'players') then
    raise exception 'Expected players in load_changes upserts';
  end if;
  if not (v_changes->'deletes' ? 'players') then
    raise exception 'Expected players in load_changes deletes';
  end if;

  -- Bookings must NOT be in upserts or deletes
  if (v_changes->'upserts' ? 'bookings') then
    raise exception 'Bookings must not be returned in load_changes upserts';
  end if;
  if (v_changes->'deletes' ? 'bookings') then
    raise exception 'Bookings must not be returned in load_changes deletes';
  end if;

  -- Cleanup
  delete from public.players where id = 'pl_test_retire';
  delete from public.bookings where id = 'bk_test_retire';
  delete from public.deleted_rows where id in ('bk_deleted_test', 'pl_deleted_test');
end $$;
