-- OYUN data store.
-- One table per entity; each row keeps the entity as jsonb, with the columns the
-- database needs for integrity (slot locking) pulled out as generated columns.
-- Only the server talks to these tables, using the secret key: RLS is on with no
-- policies, so the publishable key and logged-in Supabase users cannot read them.

create table public.app_meta (
  id smallint primary key default 1 check (id = 1),
  rev bigint not null default 0,
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array[
    'turfs', 'partners', 'staff', 'players', 'bookings', 'blocks', 'offers',
    'add_ons', 'applications', 'wallet_txns', 'promo_codes', 'pricing', 'app_config'
  ] loop
    execute format(
      'create table public.%I (
         id text primary key,
         seq bigint generated always as identity,
         data jsonb not null,
         updated_at timestamptz not null default now()
       )', t);
    execute format('create index %I on public.%I (seq)', t || '_seq_idx', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

alter table public.app_meta enable row level security;

-- Slot locking: at most one live booking and one block per turf, date and hour
alter table public.bookings
  add column turf_id text generated always as (data->>'turfId') stored,
  add column slot_date text generated always as (data->>'date') stored,
  add column slot_hour int generated always as ((data->>'hour')::int) stored,
  add column status text generated always as (data->>'status') stored;
create unique index bookings_live_slot_uniq on public.bookings (turf_id, slot_date, slot_hour)
  where status in ('confirmed', 'checked_in');
create unique index bookings_code_uniq on public.bookings ((data->>'code'));

alter table public.blocks
  add column turf_id text generated always as (data->>'turfId') stored,
  add column slot_date text generated always as (data->>'date') stored,
  add column slot_hour int generated always as ((data->>'hour')::int) stored;
create unique index blocks_slot_uniq on public.blocks (turf_id, slot_date, slot_hour);

create unique index players_phone_uniq on public.players ((data->>'phone'));

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
    'add_ons', 'applications', 'wallet_txns', 'promo_codes', 'pricing', 'app_config'
  ] loop
    execute format(
      'select coalesce(jsonb_agg(jsonb_build_object(''id'', id, ''data'', data) order by seq), ''[]''::jsonb) from public.%I', t)
      into rows;
    result := result || jsonb_build_object(t, rows);
  end loop;
  return result || jsonb_build_object('rev', (select rev from public.app_meta where id = 1));
end $$;

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
    'add_ons', 'applications', 'wallet_txns', 'promo_codes', 'pricing', 'app_config'
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

-- Wipe everything (admin "reset demo data"); the app reseeds on next load
create or replace function public.reset_state()
returns void
language plpgsql
set search_path = public
as $$
begin
  truncate public.turfs, public.partners, public.staff, public.players, public.bookings,
    public.blocks, public.offers, public.add_ons, public.applications, public.wallet_txns,
    public.promo_codes, public.pricing, public.app_config, public.app_meta restart identity;
end $$;

-- Server only: the secret key maps to service_role
revoke all on function public.load_state() from public, anon, authenticated;
revoke all on function public.apply_changes(jsonb, bigint) from public, anon, authenticated;
revoke all on function public.reset_state() from public, anon, authenticated;
grant execute on function public.load_state() to service_role;
grant execute on function public.apply_changes(jsonb, bigint) to service_role;
grant execute on function public.reset_state() to service_role;
