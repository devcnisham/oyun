-- OYUN database setup, step 5 of 5. Run the steps in order in Supabase → SQL Editor.
-- Paste the WHOLE file, make sure no text is highlighted, then click Run. Safe to run again.
-- Already set up with steps 1 to 4 before? Run just this file.

-- Delta sync: servers keep the store in memory and fetch only what changed.
-- Every row records the revision that last wrote it, deletions leave a tombstone,
-- and load_changes(since) returns just the rows written after `since`.
-- Before this, every request downloaded every table (load_state), so the
-- bytes per request grew with every booking ever made.
-- Safe to run again. Run after 20261006000000_oyun_store.sql.

alter table public.app_meta add column if not exists delta_from bigint not null default 0;

do $$
declare t text;
begin
  foreach t in array array[
    'turfs', 'partners', 'staff', 'players', 'bookings', 'blocks', 'offers',
    'add_ons', 'applications', 'wallet_txns', 'holds', 'promo_codes', 'pricing', 'app_config'
  ] loop
    execute format('alter table public.%I add column if not exists rev bigint not null default 0', t);
    execute format('create index if not exists %I on public.%I (rev)', t || '_rev_idx', t);
  end loop;
end $$;

create table if not exists public.deleted_rows (
  tbl text not null,
  id text not null,
  rev bigint not null,
  primary key (tbl, id)
);
create index if not exists deleted_rows_rev_idx on public.deleted_rows (rev);
alter table public.deleted_rows enable row level security;

-- Deltas are only complete from the revision this migration ran at.
-- Servers that last synced before it reload everything once.
update public.app_meta set delta_from = rev where id = 1 and delta_from < rev;

-- Same contract as before, plus: stamp each written row with the new revision,
-- and record deletions so other servers can drop the rows from memory.
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

-- What changed after revision `since`, in one consistent read.
-- Falls back to the whole state (with full = true) when the caller is too far
-- behind, ahead of the database (it was reset), or the store is empty.
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

  foreach t in array array[
    'turfs', 'partners', 'staff', 'players', 'bookings', 'blocks', 'offers',
    'add_ons', 'applications', 'wallet_txns', 'holds', 'promo_codes', 'pricing', 'app_config'
  ] loop
    execute format(
      'select coalesce(jsonb_agg(jsonb_build_object(''id'', id, ''data'', data) order by seq), ''[]''::jsonb) from public.%I where rev > $1', t)
      into rows using since;
    if rows <> '[]'::jsonb then
      upserts := upserts || jsonb_build_object(t, rows);
    end if;
  end loop;

  select coalesce(jsonb_object_agg(tbl, ids), '{}'::jsonb) into deletes
    from (select tbl, jsonb_agg(id) as ids from public.deleted_rows where rev > since group by tbl) d;

  return jsonb_build_object('rev', cur, 'full', false, 'upserts', upserts, 'deletes', deletes);
end $$;

-- reset_state also clears tombstones
create or replace function public.reset_state()
returns void
language plpgsql
set search_path = public
as $$
begin
  truncate public.turfs, public.partners, public.staff, public.players, public.bookings,
    public.blocks, public.offers, public.add_ons, public.applications, public.wallet_txns, public.holds,
    public.promo_codes, public.pricing, public.app_config, public.app_meta, public.deleted_rows restart identity;
end $$;

revoke all on function public.load_changes(bigint) from public, anon, authenticated;
revoke all on function public.apply_changes(jsonb, bigint) from public, anon, authenticated;
revoke all on function public.reset_state() from public, anon, authenticated;
grant execute on function public.load_changes(bigint) to service_role;
grant execute on function public.apply_changes(jsonb, bigint) to service_role;
grant execute on function public.reset_state() to service_role;
