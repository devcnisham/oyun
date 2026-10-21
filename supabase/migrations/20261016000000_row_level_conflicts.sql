-- Row-level conflict detection for the store.
-- Before: apply_changes() accepted a write only if NO other write had landed since the caller loaded
-- the store (app_meta.rev = expected_rev). Any two concurrent writes conflicted, even on unrelated
-- rows (a new player vs a wallet top-up), so conflicts and retries grew with traffic.
-- Now: a write conflicts only if a row it touches (upsert or delete) was written, or deleted, after
-- expected_rev. Writes to different rows both succeed; the revision counter is still bumped under a
-- short row lock so revisions stay strictly increasing and delta sync (load_changes) stays correct.
-- The new revision can now be more than expected_rev + 1 (other writers landed in between), so
-- callers must not assume their write is the next revision.
-- A mutation that reads a row it does not write is no longer protected from that row changing
-- underneath it; if it depends on the row, it must write it too.
-- Safe to run again. Run after 20261007000000_delta_sync.sql.

create or replace function public.apply_changes(changes jsonb, expected_rev bigint)
returns bigint
language plpgsql
set search_path = public
as $$
declare
  t text;
  cur bigint;
  new_rev bigint;
  touched text[];
  clash boolean;
begin
  if expected_rev is null then
    insert into public.app_meta (id, rev) values (1, 1) on conflict (id) do nothing;
    if not found then
      raise exception 'store_conflict' using errcode = '40001';
    end if;
    new_rev := 1;
  else
    -- Short critical section: only revision allocation is serialised
    select rev into cur from public.app_meta where id = 1 for update;
    if cur is null or expected_rev > cur then
      raise exception 'store_conflict' using errcode = '40001';
    end if;
    new_rev := cur + 1;
    update public.app_meta set rev = new_rev, updated_at = now() where id = 1;
  end if;

  foreach t in array array[
    'turfs', 'partners', 'staff', 'players', 'bookings', 'blocks', 'offers',
    'add_ons', 'applications', 'wallet_txns', 'holds', 'promo_codes', 'pricing', 'app_config'
  ] loop
    touched := array(
      select r->>'id' from jsonb_array_elements(coalesce(changes->'upserts'->t, '[]'::jsonb)) as r
      union
      select x from jsonb_array_elements_text(coalesce(changes->'deletes'->t, '[]'::jsonb)) as x
    );
    if cardinality(touched) = 0 then
      continue;
    end if;

    if expected_rev is not null then
      -- A touched row written or deleted after the caller loaded it
      execute format('select exists (select 1 from public.%I where id = any($1) and rev > $2)', t)
        into clash using touched, expected_rev;
      if not clash then
        select exists (select 1 from public.deleted_rows d where d.tbl = t and d.id = any(touched) and d.rev > expected_rev)
          into clash;
      end if;
      if clash then
        raise exception 'store_conflict' using errcode = '40001';
      end if;
    end if;

    if changes->'deletes' ? t then
      execute format('delete from public.%I where id in (select jsonb_array_elements_text($1))', t)
        using changes->'deletes'->t;
      insert into public.deleted_rows (tbl, id, rev)
        select t, x, new_rev from jsonb_array_elements_text(changes->'deletes'->t) as x
      on conflict (tbl, id) do update set rev = excluded.rev;
    end if;
    if changes->'upserts' ? t then
      execute format(
        'insert into public.%I (id, data, rev)
           select r->>''id'', r->''data'', $2 from jsonb_array_elements($1) with ordinality as e(r, n) order by n
         on conflict (id) do update set data = excluded.data, rev = excluded.rev, updated_at = now()', t)
        using changes->'upserts'->t, new_rev;
      -- A row that comes back after a delete is live again
      delete from public.deleted_rows d
        where d.tbl = t and d.id in (select r->>'id' from jsonb_array_elements(changes->'upserts'->t) as r);
    end if;
  end loop;

  -- Keep tombstones for the last 50,000 writes; older servers reload in full
  if new_rev % 1000 = 0 and new_rev > 50000 then
    delete from public.deleted_rows where rev <= new_rev - 50000;
    update public.app_meta set delta_from = greatest(delta_from, new_rev - 50000) where id = 1;
  end if;
  return new_rev;
end $$;

-- Grants survive create or replace; restated so this file is complete on its own
revoke all on function public.apply_changes(jsonb, bigint) from public, anon, authenticated;
grant execute on function public.apply_changes(jsonb, bigint) to service_role;
