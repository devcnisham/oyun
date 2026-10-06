-- OYUN database setup, step 1 of 4. Run the steps in order in Supabase → SQL Editor.
-- Paste the WHOLE file, make sure no text is highlighted, then click Run. Safe to run again.

-- OYUN data store.
-- One table per entity; each row keeps the entity as jsonb, with the columns the
-- database needs for integrity (slot locking) pulled out as generated columns.
-- Only the server talks to these tables, using the secret key: RLS is on with no
-- policies, so the publishable key and logged-in Supabase users cannot read them.
-- Safe to run again: everything is created only if it is missing.

create table if not exists public.app_meta (
  id smallint primary key default 1 check (id = 1),
  rev bigint not null default 0,
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array[
    'turfs', 'partners', 'staff', 'players', 'bookings', 'blocks', 'offers',
    'add_ons', 'applications', 'wallet_txns', 'holds', 'promo_codes', 'pricing', 'app_config'
  ] loop
    execute format(
      'create table if not exists public.%I (
         id text primary key,
         seq bigint generated always as identity,
         data jsonb not null,
         updated_at timestamptz not null default now()
       )', t);
    execute format('create index if not exists %I on public.%I (seq)', t || '_seq_idx', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

alter table public.app_meta enable row level security;

-- Slot locking: at most one live booking and one block per turf, date and hour
alter table public.bookings
  add column if not exists turf_id text generated always as (data->>'turfId') stored,
  add column if not exists slot_date text generated always as (data->>'date') stored,
  add column if not exists slot_hour int generated always as ((data->>'hour')::int) stored,
  add column if not exists status text generated always as (data->>'status') stored;
create unique index if not exists bookings_live_slot_uniq on public.bookings (turf_id, slot_date, slot_hour)
  where status in ('confirmed', 'checked_in');
create unique index if not exists bookings_code_uniq on public.bookings ((data->>'code'));

alter table public.blocks
  add column if not exists turf_id text generated always as (data->>'turfId') stored,
  add column if not exists slot_date text generated always as (data->>'date') stored,
  add column if not exists slot_hour int generated always as ((data->>'hour')::int) stored;
create unique index if not exists blocks_slot_uniq on public.blocks (turf_id, slot_date, slot_hour);

-- A slot can only be held for one checkout at a time
alter table public.holds
  add column if not exists turf_id text generated always as (data->>'turfId') stored,
  add column if not exists slot_date text generated always as (data->>'date') stored,
  add column if not exists slot_hour int generated always as ((data->>'hour')::int) stored;
create unique index if not exists holds_slot_uniq on public.holds (turf_id, slot_date, slot_hour);

create unique index if not exists players_phone_uniq on public.players ((data->>'phone'));
