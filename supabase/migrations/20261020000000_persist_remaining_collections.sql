-- Persist the collections the store was silently dropping.
-- waitlist, payouts, open matches, tournaments and the partner activity log live on the app's Database
-- object but had no table, so with Supabase they vanished on the next server restart (payouts included).
-- This adds a table for each, and replaces the four store functions with versions that read one list of
-- tables (store_tables()), so the next collection is a one-line change instead of four.
-- apply_changes keeps the row-level conflict check from 20261016. Safe to run again.

create or replace function public.store_tables() returns text[]
language sql immutable set search_path = public as $$
  select array[
    'turfs', 'partners', 'staff', 'players', 'bookings', 'blocks', 'offers',
    'add_ons', 'applications', 'wallet_txns', 'holds', 'promo_codes', 'pricing', 'app_config',
    'waitlist', 'payouts', 'open_matches', 'tournaments', 'activity'
  ]
$$;

do $$
declare t text;
begin
  foreach t in array array['waitlist', 'payouts', 'open_matches', 'tournaments', 'activity'] loop
    execute format(
      'create table if not exists public.%I (
         id text primary key,
         seq bigint generated always as identity,
         data jsonb not null,
         updated_at timestamptz not null default now(),
         rev bigint not null default 0
       )', t);
    execute format('create index if not exists %I on public.%I (seq)', t || '_seq_idx', t);
    execute format('create index if not exists %I on public.%I (rev)', t || '_rev_idx', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

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
  foreach t in array public.store_tables() loop
    execute format(
      'select coalesce(jsonb_agg(jsonb_build_object(''id'', id, ''data'', data) order by seq), ''[]''::jsonb) from public.%I', t)
      into rows;
    result := result || jsonb_build_object(t, rows);
  end loop;
  return result || jsonb_build_object('rev', (select rev from public.app_meta where id = 1));
end $$;

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
    select rev into cur from public.app_meta where id = 1 for update;
    if cur is null or expected_rev > cur then
      raise exception 'store_conflict' using errcode = '40001';
    end if;
    new_rev := cur + 1;
    update public.app_meta set rev = new_rev, updated_at = now() where id = 1;
  end if;

  foreach t in array public.store_tables() loop
    touched := array(
      select r->>'id' from jsonb_array_elements(coalesce(changes->'upserts'->t, '[]'::jsonb)) as r
      union
      select x from jsonb_array_elements_text(coalesce(changes->'deletes'->t, '[]'::jsonb)) as x
    );
    if cardinality(touched) = 0 then
      continue;
    end if;

    if expected_rev is not null then
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
      delete from public.deleted_rows d
        where d.tbl = t and d.id in (select r->>'id' from jsonb_array_elements(changes->'upserts'->t) as r);
    end if;
  end loop;

  if new_rev % 1000 = 0 and new_rev > 50000 then
    delete from public.deleted_rows where rev <= new_rev - 50000;
    update public.app_meta set delta_from = greatest(delta_from, new_rev - 50000) where id = 1;
  end if;
  return new_rev;
end $$;

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

  foreach t in array public.store_tables() loop
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

create or replace function public.reset_state()
returns void
language plpgsql
set search_path = public
as $$
declare t text;
begin
  foreach t in array public.store_tables() loop
    execute format('truncate public.%I restart identity', t);
  end loop;
  truncate public.app_meta, public.deleted_rows restart identity;
end $$;

revoke all on function public.store_tables() from public, anon, authenticated;
revoke all on function public.load_state() from public, anon, authenticated;
revoke all on function public.apply_changes(jsonb, bigint) from public, anon, authenticated;
revoke all on function public.load_changes(bigint) from public, anon, authenticated;
revoke all on function public.reset_state() from public, anon, authenticated;
grant execute on function public.store_tables() to service_role;
grant execute on function public.load_state() to service_role;
grant execute on function public.apply_changes(jsonb, bigint) to service_role;
grant execute on function public.load_changes(bigint) to service_role;
grant execute on function public.reset_state() to service_role;
