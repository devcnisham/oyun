-- OYUN slot booking schema v2 — PROPOSAL, not used by the app yet.
--
-- Replaces the jsonb document store for booking data with relational tables.
-- Lives in its own schema (`oyun`) so it can sit next to the current tables while the
-- app is moved over. Design notes: docs/SLOT-BOOKING-DB.md.
--
-- Core idea: every booking, checkout hold and owner block occupies one or more
-- physical RESOURCES (a pitch half, a court) for a TIME RANGE. All of them write rows
-- to oyun.slot_claims, and one exclusion constraint makes overlapping claims on the
-- same resource impossible. That one rule covers:
--   * two players booking the same court and time
--   * full pitch vs half pitch (full occupies both halves)
--   * badminton vs pickleball on the same physical court
--   * a 90-minute slot overlapping a 60-minute one
--   * owner blocks and walk-ins vs online bookings
--
-- Safe to run again on an empty schema. Server-only: RLS on, no policies.

create extension if not exists btree_gist;
create extension if not exists citext;

create schema if not exists oyun;

-- ───────────────────────── types ─────────────────────────

do $$ begin
  create type oyun.venue_status as enum ('pending', 'active', 'maintenance', 'suspended');
exception when duplicate_object then null; end $$;

-- held: in checkout, expires at hold_expires_at
-- pending_payment: paying online, claims kept until hold_expires_at
-- confirmed → checked_in → completed, or no_show / cancelled; held → expired
do $$ begin
  create type oyun.booking_status as enum
    ('held', 'pending_payment', 'confirmed', 'checked_in', 'completed', 'no_show', 'cancelled', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type oyun.payment_status as enum ('created', 'captured', 'failed', 'refunded', 'partially_refunded');
exception when duplicate_object then null; end $$;

-- ───────────────────────── people ─────────────────────────

create table if not exists oyun.partners (
  id            uuid primary key default gen_random_uuid(),
  legal_name    text not null,
  display_name  text not null,
  email         citext not null unique,
  phone         text not null,
  gstin         text check (gstin is null or gstin ~ '^[0-9]{2}[A-Z0-9]{13}$'),
  status        text not null default 'active' check (status in ('active', 'suspended')),
  created_at    timestamptz not null default now()
);

create table if not exists oyun.partner_members (
  id             uuid primary key default gen_random_uuid(),
  partner_id     uuid not null references oyun.partners on delete cascade,
  clerk_user_id  text unique,
  name           text not null,
  email          citext not null,
  phone          text,
  role           text not null check (role in ('owner', 'manager', 'front_desk')),
  password_hash  text,
  created_at     timestamptz not null default now(),
  unique (partner_id, email)
);

create table if not exists oyun.players (
  id             uuid primary key default gen_random_uuid(),
  clerk_user_id  text unique,
  name           text not null,
  phone          text not null unique check (phone ~ '^[6-9][0-9]{9}$'),
  status         text not null default 'active' check (status in ('active', 'banned')),
  referral_code  citext unique,
  referred_by    uuid references oyun.players,
  created_at     timestamptz not null default now()
);

-- ───────────────────────── places ─────────────────────────

create table if not exists oyun.areas (
  id    uuid primary key default gen_random_uuid(),
  city  text not null,
  name  text not null,
  slug  text not null unique,
  unique (city, name)
);

create table if not exists oyun.sports (
  code                  text primary key,          -- 'football', 'box_cricket', 'badminton', 'pickleball', 'padel'
  name                  text not null,
  default_slot_minutes  int  not null default 60
);

create table if not exists oyun.venues (
  id                     uuid primary key default gen_random_uuid(),
  partner_id             uuid references oyun.partners,
  slug                   text not null unique,
  name                   text not null,
  area_id                uuid references oyun.areas,
  address                text not null default '',
  lat                    numeric(9, 6),
  lng                    numeric(9, 6),
  timezone               text not null default 'Asia/Kolkata',
  status                 oyun.venue_status not null default 'pending',
  is_verified            boolean not null default false,
  commission_percent     numeric(5, 2) check (commission_percent between 0 and 100),   -- null = platform default
  cancel_cutoff_minutes  int not null default 120 check (cancel_cutoff_minutes >= 0),
  booking_window_days    int not null default 7 check (booking_window_days between 1 and 90),
  description            text not null default '',
  amenities              text[] not null default '{}',
  images                 text[] not null default '{}',
  phone                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Opening hours per weekday (0 = Sunday … 6 = Saturday, as extract(dow)).
-- closes <= opens means the venue closes after midnight (06:00–01:00).
-- Several rows per day allow a midday break.
create table if not exists oyun.opening_hours (
  venue_id  uuid not null references oyun.venues on delete cascade,
  weekday   smallint not null check (weekday between 0 and 6),
  opens     time not null,
  closes    time not null,
  primary key (venue_id, weekday, opens)
);

-- A physical unit that can only be used by one booking at a time:
-- "Pitch half A", "Pitch half B", "Court 1".
create table if not exists oyun.resources (
  id        uuid primary key default gen_random_uuid(),
  venue_id  uuid not null references oyun.venues on delete cascade,
  name      text not null,
  sort      smallint not null default 0,
  active    boolean not null default true,
  unique (venue_id, name)
);

-- What a player picks: "7-a-side full pitch", "5-a-side half pitch (A)", "Badminton court 2".
-- Each bookable occupies one or more resources (bookable_resources).
create table if not exists oyun.bookables (
  id            uuid primary key default gen_random_uuid(),
  venue_id      uuid not null references oyun.venues on delete cascade,
  sport         text not null references oyun.sports,
  name          text not null,
  slot_minutes  int  not null check (slot_minutes between 15 and 240 and slot_minutes % 15 = 0),
  max_slots     smallint not null default 6 check (max_slots between 1 and 24),
  base_price    int  not null check (base_price >= 0),       -- rupees per slot
  active        boolean not null default true,
  sort          smallint not null default 0,
  unique (venue_id, name)
);

create table if not exists oyun.bookable_resources (
  bookable_id  uuid not null references oyun.bookables on delete cascade,
  resource_id  uuid not null references oyun.resources on delete cascade,
  primary key (bookable_id, resource_id)
);
create index if not exists bookable_resources_resource_idx on oyun.bookable_resources (resource_id);

-- A bookable may only use resources of its own venue
create or replace function oyun.check_bookable_resource() returns trigger language plpgsql as $$
begin
  if (select venue_id from oyun.bookables where id = new.bookable_id)
     is distinct from (select venue_id from oyun.resources where id = new.resource_id) then
    raise exception 'resource belongs to another venue' using errcode = '23514';
  end if;
  return new;
end $$;
drop trigger if exists bookable_resources_same_venue on oyun.bookable_resources;
create trigger bookable_resources_same_venue before insert or update on oyun.bookable_resources
  for each row execute function oyun.check_bookable_resource();

-- ───────────────────────── pricing ─────────────────────────

-- Rules are applied in priority order (lowest first): 'set' replaces the price,
-- 'percent' and 'flat' adjust it. weekdays null = every day; times in venue local time.
-- Peak hours, weekend rates and happy hours are all rows here.
create table if not exists oyun.price_rules (
  id           uuid primary key default gen_random_uuid(),
  bookable_id  uuid not null references oyun.bookables on delete cascade,
  name         text not null,
  weekdays     smallint[],
  starts       time not null default '00:00',
  ends         time not null default '24:00',
  valid_from   date,
  valid_to     date,
  kind         text not null check (kind in ('set', 'percent', 'flat')),
  value        int  not null,
  priority     int  not null default 0,
  active       boolean not null default true,
  check (starts < ends)
);
create index if not exists price_rules_bookable_idx on oyun.price_rules (bookable_id) where active;

-- ───────────────────────── bookings ─────────────────────────

create table if not exists oyun.bookings (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  venue_id          uuid not null references oyun.venues,
  player_id         uuid references oyun.players,
  holder            text,                 -- device/session that holds it during checkout
  customer_name     text,
  customer_phone    text,
  source            text not null default 'online' check (source in ('online', 'walk_in', 'phone')),
  status            oyun.booking_status not null default 'held',
  hold_expires_at   timestamptz,
  idempotency_key   text,
  created_by        uuid references oyun.partner_members,
  subtotal          int not null default 0,
  discount          int not null default 0,
  wallet_used       int not null default 0,
  total             int not null default 0 check (total >= 0),
  advance_due       int not null default 0,
  amount_paid       int not null default 0,
  price_breakdown   jsonb not null default '{}',     -- snapshot of every line shown at checkout
  cancelled_at      timestamptz,
  cancel_reason     text,
  checked_in_at     timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (status not in ('held', 'pending_payment') or hold_expires_at is not null),
  unique (holder, idempotency_key)
);
create index if not exists bookings_venue_status_idx on oyun.bookings (venue_id, status);
create index if not exists bookings_player_idx on oyun.bookings (player_id, created_at desc);
create index if not exists bookings_open_holds_idx on oyun.bookings (hold_expires_at) where status in ('held', 'pending_payment');

-- One row per booked slot (a 3-hour booking has 3 items)
create table if not exists oyun.booking_items (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references oyun.bookings on delete cascade,
  bookable_id  uuid not null references oyun.bookables,
  during       tstzrange not null check (lower(during) < upper(during)),
  price        int not null check (price >= 0)
);
create index if not exists booking_items_booking_idx on oyun.booking_items (booking_id);
create index if not exists booking_items_bookable_idx on oyun.booking_items using gist (bookable_id, during);

-- Owner blocks: maintenance, private events, holidays
create table if not exists oyun.blocks (
  id           uuid primary key default gen_random_uuid(),
  venue_id     uuid not null references oyun.venues on delete cascade,
  bookable_id  uuid not null references oyun.bookables on delete cascade,
  during       tstzrange not null check (lower(during) < upper(during)),
  reason       text not null default '',
  created_by   uuid references oyun.partner_members,
  created_at   timestamptz not null default now()
);

-- ─────────────── the double-booking guard ───────────────

create table if not exists oyun.slot_claims (
  id               bigint generated always as identity primary key,
  resource_id      uuid not null references oyun.resources,
  during           tstzrange not null,
  booking_item_id  uuid references oyun.booking_items on delete cascade,
  block_id         uuid references oyun.blocks on delete cascade,
  released_at      timestamptz,
  check (num_nonnulls(booking_item_id, block_id) = 1),
  -- No two live claims on one resource may overlap in time
  constraint slot_claims_no_overlap
    exclude using gist (resource_id with =, during with &&) where (released_at is null)
);
create index if not exists slot_claims_item_idx on oyun.slot_claims (booking_item_id);
create index if not exists slot_claims_block_idx on oyun.slot_claims (block_id);

-- Claims follow their booking: cancelled or expired bookings free their slots
create or replace function oyun.release_claims_on_status() returns trigger language plpgsql as $$
begin
  if new.status in ('cancelled', 'expired') and old.status is distinct from new.status then
    update oyun.slot_claims c set released_at = now()
      from oyun.booking_items i
     where i.booking_id = new.id and c.booking_item_id = i.id and c.released_at is null;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists bookings_release_claims on oyun.bookings;
create trigger bookings_release_claims before update on oyun.bookings
  for each row execute function oyun.release_claims_on_status();

-- ───────────────────────── money ─────────────────────────

create table if not exists oyun.payments (
  id                   uuid primary key default gen_random_uuid(),
  booking_id           uuid not null references oyun.bookings,
  provider             text not null default 'razorpay',
  provider_order_id    text not null unique,
  provider_payment_id  text unique,
  amount               int not null check (amount > 0),     -- rupees
  status               oyun.payment_status not null default 'created',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists payments_booking_idx on oyun.payments (booking_id);

-- Every webhook, stored once: a repeated event id is ignored
create table if not exists oyun.payment_events (
  id            bigint generated always as identity primary key,
  provider      text not null,
  event_id      text not null,
  payload       jsonb not null,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  unique (provider, event_id)
);

create table if not exists oyun.refunds (
  id                  uuid primary key default gen_random_uuid(),
  payment_id          uuid references oyun.payments,
  booking_id          uuid not null references oyun.bookings,
  amount              int not null check (amount > 0),
  to_wallet           boolean not null default false,
  status              text not null default 'pending' check (status in ('pending', 'processed', 'failed')),
  provider_refund_id  text unique,
  reason              text not null,
  created_at          timestamptz not null default now()
);

-- Wallet: the ledger is the only source of truth; the balance is its sum
create table if not exists oyun.wallet_ledger (
  id          bigint generated always as identity primary key,
  player_id   uuid not null references oyun.players,
  amount      int not null check (amount <> 0),            -- + credit, − debit
  kind        text not null check (kind in ('cashback', 'referral', 'referral_bonus', 'refund', 'booking_payment', 'admin_adjust')),
  booking_id  uuid references oyun.bookings,
  note        text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists wallet_ledger_player_idx on oyun.wallet_ledger (player_id);
create or replace view oyun.wallet_balances as
  select player_id, sum(amount)::int as balance from oyun.wallet_ledger group by player_id;

create table if not exists oyun.promo_codes (
  id                uuid primary key default gen_random_uuid(),
  code              citext not null unique,
  kind              text not null check (kind in ('percent', 'flat')),
  value             int  not null check (value > 0),
  max_discount      int,
  min_order         int not null default 0,
  venue_id          uuid references oyun.venues,             -- null = every venue
  weekend_only      boolean not null default false,
  starts_at         timestamptz,
  ends_at           timestamptz,
  max_uses          int,
  per_player_limit  int not null default 1,
  active            boolean not null default true
);

create table if not exists oyun.promo_redemptions (
  id          bigint generated always as identity primary key,
  promo_id    uuid not null references oyun.promo_codes,
  player_id   uuid not null references oyun.players,
  booking_id  uuid not null unique references oyun.bookings,
  discount    int not null,
  created_at  timestamptz not null default now()
);
create index if not exists promo_redemptions_promo_player_idx on oyun.promo_redemptions (promo_id, player_id);

create table if not exists oyun.add_ons (
  id        uuid primary key default gen_random_uuid(),
  venue_id  uuid not null references oyun.venues on delete cascade,
  name      text not null,
  price     int  not null check (price >= 0),
  active    boolean not null default true
);

create table if not exists oyun.booking_add_ons (
  booking_id  uuid not null references oyun.bookings on delete cascade,
  add_on_id   uuid not null references oyun.add_ons,
  name        text not null,          -- snapshot
  price       int  not null,          -- snapshot
  qty         smallint not null check (qty between 1 and 50),
  primary key (booking_id, add_on_id)
);

-- GST invoices need gap-free numbers per financial year
create table if not exists oyun.invoice_counters (
  fy    text primary key,              -- '2026-27'
  last  int not null default 0
);
create table if not exists oyun.invoices (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null unique references oyun.bookings,
  fy           text not null,
  seq          int not null,
  number       text not null unique,   -- 'OYN/2026-27/000123'
  gst_percent  numeric(5, 2) not null,
  taxable      int not null,
  gst          int not null,
  issued_at    timestamptz not null default now(),
  unique (fy, seq)
);

create table if not exists oyun.payouts (
  id                 uuid primary key default gen_random_uuid(),
  partner_id         uuid not null references oyun.partners,
  period             daterange not null,
  gross              int not null,
  commission         int not null,
  gst_on_commission  int not null,
  net                int not null,
  status             text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  paid_at            timestamptz,
  exclude using gist (partner_id with =, period with &&)       -- no overlapping payout periods
);
create table if not exists oyun.payout_items (
  payout_id   uuid not null references oyun.payouts on delete cascade,
  booking_id  uuid not null unique references oyun.bookings,      -- a booking is paid out once
  primary key (payout_id, booking_id)
);

create table if not exists oyun.reviews (
  booking_id  uuid primary key references oyun.bookings,
  venue_id    uuid not null references oyun.venues,
  player_id   uuid references oyun.players,
  rating      smallint not null check (rating between 1 and 5),
  comment     text not null default '' check (length(comment) <= 1000),
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists reviews_venue_idx on oyun.reviews (venue_id) where not hidden;

create table if not exists oyun.audit_log (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  actor      text not null,             -- 'player:<id>', 'member:<id>', 'admin', 'system'
  action     text not null,
  entity     text not null,
  entity_id  text not null,
  data       jsonb not null default '{}'
);

-- ───────────────────────── slot logic ─────────────────────────

-- The opening interval (as timestamps) that contains [p_start, p_end), or null when closed.
-- Checks the same local day and the previous day (for venues open past midnight).
create or replace function oyun.open_interval(p_venue uuid, p_start timestamptz, p_end timestamptz)
returns tstzrange language sql stable as $$
  select r from (
    select tstzrange(
             ((d + oh.opens)::timestamp at time zone v.timezone),
             ((d + oh.closes + case when oh.closes <= oh.opens then interval '1 day' else interval '0' end)::timestamp at time zone v.timezone)
           ) as r
      from oyun.venues v
      join oyun.opening_hours oh on oh.venue_id = v.id
      cross join lateral (values ((p_start at time zone v.timezone)::date),
                                 ((p_start at time zone v.timezone)::date - 1)) as days(d)
     where v.id = p_venue and oh.weekday = extract(dow from d)
  ) x
  where r @> tstzrange(p_start, p_end)
  limit 1
$$;

-- Price of one slot of a bookable starting at p_start
create or replace function oyun.slot_price(p_bookable uuid, p_start timestamptz)
returns int language plpgsql stable as $$
declare
  b oyun.bookables;
  tz text;
  local_ts timestamp;
  price numeric;
  r oyun.price_rules;
begin
  select * into b from oyun.bookables where id = p_bookable;
  select timezone into tz from oyun.venues where id = b.venue_id;
  local_ts := p_start at time zone tz;
  price := b.base_price;
  for r in
    select * from oyun.price_rules
     where bookable_id = p_bookable and active
       and (weekdays is null or extract(dow from local_ts)::smallint = any (weekdays))
       and local_ts::time >= starts and local_ts::time < ends
       and (valid_from is null or local_ts::date >= valid_from)
       and (valid_to is null or local_ts::date <= valid_to)
     order by priority, id
  loop
    price := case r.kind
               when 'set' then r.value
               when 'percent' then price * (100 + r.value) / 100.0
               else price + r.value
             end;
  end loop;
  return greatest(0, round(price))::int;
end $$;

-- Take a transaction lock on each resource, always in the same order. Concurrent bookings
-- of the same court then queue up and the loser gets a clean 'slot_taken' instead of a
-- deadlock between two exclusion-constraint checks.
create or replace function oyun.lock_resources(p_resources uuid[]) returns void language sql as $$
  select pg_advisory_xact_lock(hashtextextended(r::text, 0))
    from (select distinct unnest(p_resources) as r order by 1) x
$$;

-- Mark held bookings whose time ran out as expired (frees their claims).
-- Called before every hold; also run every minute with pg_cron.
create or replace function oyun.expire_holds() returns int language sql as $$
  with x as (
    update oyun.bookings set status = 'expired'
     where status in ('held', 'pending_payment') and hold_expires_at < now()
    returning 1)
  select count(*)::int from x
$$;

-- Hold slots for checkout. Replaces this holder's earlier hold.
-- p_starts: slot start times. Returns the new booking id (status 'held').
-- Raises 'slot_taken' when any slot overlaps a live claim.
create or replace function oyun.hold_slots(
  p_holder text, p_bookable uuid, p_starts timestamptz[],
  p_player uuid default null, p_ttl interval default interval '8 minutes')
returns uuid language plpgsql as $$
declare
  b oyun.bookables;
  v oyun.venues;
  bk uuid;
  s timestamptz;
  slot tstzrange;
  open_r tstzrange;
  item uuid;
begin
  select * into b from oyun.bookables where id = p_bookable and active;
  if not found then raise exception 'bookable_not_found' using errcode = 'P0002'; end if;
  select * into v from oyun.venues where id = b.venue_id;
  if v.status <> 'active' then raise exception 'venue_not_bookable' using errcode = 'P0001'; end if;
  if coalesce(array_length(p_starts, 1), 0) = 0 or array_length(p_starts, 1) > b.max_slots then
    raise exception 'pick between 1 and % slots', b.max_slots using errcode = 'P0001';
  end if;

  perform oyun.lock_resources(array(select resource_id from oyun.bookable_resources where bookable_id = b.id));
  perform oyun.expire_holds();
  update oyun.bookings set status = 'expired'
   where holder = p_holder and status = 'held';

  insert into oyun.bookings (venue_id, player_id, holder, status, hold_expires_at)
  values (v.id, p_player, p_holder, 'held', now() + p_ttl)
  returning id into bk;

  foreach s in array (select array_agg(distinct x order by x) from unnest(p_starts) x) loop
    slot := tstzrange(s, s + make_interval(mins => b.slot_minutes));
    if s < now() then raise exception 'slot_in_past' using errcode = 'P0001'; end if;
    if s > now() + make_interval(days => v.booking_window_days) then
      raise exception 'outside_booking_window' using errcode = 'P0001';
    end if;
    open_r := oyun.open_interval(v.id, lower(slot), upper(slot));
    if open_r is null then raise exception 'venue_closed' using errcode = 'P0001'; end if;
    -- Slots start on the venue's grid: opening time + n × slot length
    if extract(epoch from (s - lower(open_r)))::bigint % (b.slot_minutes * 60) <> 0 then
      raise exception 'not_a_slot_start' using errcode = 'P0001';
    end if;

    insert into oyun.booking_items (booking_id, bookable_id, during, price)
    values (bk, b.id, slot, oyun.slot_price(b.id, s))
    returning id into item;

    begin
      insert into oyun.slot_claims (resource_id, during, booking_item_id)
      select br.resource_id, slot, item from oyun.bookable_resources br where br.bookable_id = b.id;
    exception when exclusion_violation then
      raise exception 'slot_taken' using errcode = 'P0001',
        detail = to_char(lower(slot) at time zone v.timezone, 'DD Mon HH24:MI');
    end;
  end loop;

  update oyun.bookings
     set subtotal = (select coalesce(sum(price), 0) from oyun.booking_items where booking_id = bk),
         total    = (select coalesce(sum(price), 0) from oyun.booking_items where booking_id = bk)
   where id = bk;
  return bk;
end $$;

-- Turn a hold into a booking. p_pay_online keeps the slots for p_payment_window while
-- the player pays; the payment webhook then calls confirm_payment().
create or replace function oyun.confirm_hold(
  p_booking uuid, p_holder text, p_name text, p_phone text,
  p_pay_online boolean default false, p_payment_window interval default interval '15 minutes')
returns oyun.bookings language plpgsql as $$
declare bk oyun.bookings;
begin
  select * into bk from oyun.bookings where id = p_booking for update;
  if not found or bk.holder is distinct from p_holder then
    raise exception 'booking_not_found' using errcode = 'P0002';
  end if;
  if bk.status <> 'held' or bk.hold_expires_at < now() then
    raise exception 'hold_expired' using errcode = 'P0001';
  end if;
  update oyun.bookings
     set customer_name = p_name, customer_phone = p_phone,
         status = case when p_pay_online then 'pending_payment' else 'confirmed' end::oyun.booking_status,
         hold_expires_at = case when p_pay_online then now() + p_payment_window else null end
   where id = p_booking
  returning * into bk;
  return bk;
end $$;

-- Webhook: payment captured. Idempotent. Returns what happened:
-- 'confirmed', 'already_confirmed', or 'refund_needed' (slots were lost before the money arrived).
create or replace function oyun.confirm_payment(p_provider_order_id text, p_provider_payment_id text, p_amount int)
returns text language plpgsql as $$
declare
  pay oyun.payments;
  bk oyun.bookings;
begin
  select * into pay from oyun.payments where provider_order_id = p_provider_order_id for update;
  if not found then raise exception 'payment_not_found' using errcode = 'P0002'; end if;
  if pay.status = 'captured' then return 'already_confirmed'; end if;
  if p_amount <> pay.amount then raise exception 'amount_mismatch' using errcode = 'P0001'; end if;

  update oyun.payments set status = 'captured', provider_payment_id = p_provider_payment_id, updated_at = now()
   where id = pay.id;
  select * into bk from oyun.bookings where id = pay.booking_id for update;

  if bk.status = 'pending_payment' then
    update oyun.bookings set status = 'confirmed', hold_expires_at = null, amount_paid = amount_paid + p_amount
     where id = bk.id;
    return 'confirmed';
  end if;

  if bk.status = 'expired' then
    -- Payment came late: take the slots back if they are still free
    perform oyun.lock_resources(array(
      select c.resource_id from oyun.slot_claims c join oyun.booking_items i on i.id = c.booking_item_id where i.booking_id = bk.id));
    begin
      update oyun.slot_claims c set released_at = null
        from oyun.booking_items i
       where i.booking_id = bk.id and c.booking_item_id = i.id;
      update oyun.bookings set status = 'confirmed', hold_expires_at = null, amount_paid = amount_paid + p_amount
       where id = bk.id;
      return 'confirmed';
    exception when exclusion_violation then
      insert into oyun.refunds (payment_id, booking_id, amount, reason)
      values (pay.id, bk.id, p_amount, 'Slot taken before payment arrived');
      return 'refund_needed';
    end;
  end if;

  update oyun.bookings set amount_paid = amount_paid + p_amount where id = bk.id;
  return 'already_confirmed';
end $$;

create or replace function oyun.cancel_booking(p_booking uuid, p_reason text)
returns void language plpgsql as $$
begin
  update oyun.bookings set status = 'cancelled', cancelled_at = now(), cancel_reason = p_reason
   where id = p_booking and status in ('held', 'pending_payment', 'confirmed');
  if not found then raise exception 'cannot_cancel' using errcode = 'P0001'; end if;
end $$;

-- Owner block on a bookable (fails with slot_taken if someone already booked it)
create or replace function oyun.block_slot(p_bookable uuid, p_during tstzrange, p_reason text, p_member uuid default null)
returns uuid language plpgsql as $$
declare blk uuid;
begin
  perform oyun.lock_resources(array(select resource_id from oyun.bookable_resources where bookable_id = p_bookable));
  insert into oyun.blocks (venue_id, bookable_id, during, reason, created_by)
  select venue_id, id, p_during, p_reason, p_member from oyun.bookables where id = p_bookable
  returning id into blk;
  begin
    insert into oyun.slot_claims (resource_id, during, block_id)
    select resource_id, p_during, blk from oyun.bookable_resources where bookable_id = p_bookable;
  exception when exclusion_violation then
    raise exception 'slot_taken' using errcode = 'P0001';
  end;
  return blk;
end $$;

-- Every slot of a bookable on a local date, with its price and state
create or replace function oyun.available_slots(p_bookable uuid, p_date date)
returns table (starts_at timestamptz, ends_at timestamptz, price int, state text)
language sql stable as $$
  with b as (
    select bk.*, v.timezone from oyun.bookables bk join oyun.venues v on v.id = bk.venue_id where bk.id = p_bookable
  ),
  intervals as (
    select ((p_date + oh.opens)::timestamp at time zone b.timezone) as o,
           ((p_date + oh.closes + case when oh.closes <= oh.opens then interval '1 day' else interval '0' end)::timestamp at time zone b.timezone) as c
      from b join oyun.opening_hours oh on oh.venue_id = b.venue_id and oh.weekday = extract(dow from p_date)
  ),
  slots as (
    select s as starts_at, s + make_interval(mins => b.slot_minutes) as ends_at
      from b, intervals i,
           generate_series(i.o, i.c - make_interval(mins => b.slot_minutes), make_interval(mins => b.slot_minutes)) s
  )
  select s.starts_at, s.ends_at, oyun.slot_price(p_bookable, s.starts_at),
         case
           when s.starts_at < now() then 'past'
           else coalesce((
             select case when c.block_id is not null then 'blocked'
                         when bk.status in ('held', 'pending_payment') then 'held'
                         else 'booked' end
               from oyun.bookable_resources br
               join oyun.slot_claims c on c.resource_id = br.resource_id and c.released_at is null
                                      and c.during && tstzrange(s.starts_at, s.ends_at)
               left join oyun.booking_items i on i.id = c.booking_item_id
               left join oyun.bookings bk on bk.id = i.booking_id
              where br.bookable_id = p_bookable
                and (bk.id is null or bk.status not in ('held', 'pending_payment') or bk.hold_expires_at > now())
              order by c.block_id nulls last
              limit 1), 'available')
         end
    from slots s
   order by s.starts_at
$$;

-- ───────────────────────── access ─────────────────────────
-- Server only (secret key = service_role), like the current store.

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'oyun' loop
    execute format('alter table oyun.%I enable row level security', t);
  end loop;
end $$;

revoke all on schema oyun from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant usage on schema oyun to service_role;
    grant all on all tables in schema oyun to service_role;
    grant all on all sequences in schema oyun to service_role;
    grant execute on all functions in schema oyun to service_role;
  end if;
end $$;
revoke execute on all functions in schema oyun from public;
