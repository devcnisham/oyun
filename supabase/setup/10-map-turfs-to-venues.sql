-- Setup step 10: Data mapping from turfs to venues, resources, and bookables
-- Roadmap task: #134 Data mapping: turf to venue, resources, bookables

-- 1. Populate default sports if not present
insert into oyun.sports (code, name, default_slot_minutes) values
  ('football', 'Football', 60),
  ('box_cricket', 'Box Cricket', 60),
  ('badminton', 'Badminton', 60),
  ('pickleball', 'Pickleball', 30)
on conflict (code) do update set
  name = excluded.name,
  default_slot_minutes = excluded.default_slot_minutes;

-- 2. Function to sync one turf into the relational venue model
create or replace function oyun.sync_turf_to_venue(t jsonb)
returns uuid language plpgsql security definer as $$
declare
  v_id uuid;
  v_slug text := coalesce(t->>'id', t->>'slug');
  v_name text := coalesce(t->>'name', 'Arena');
  v_address text := coalesce(t->>'location', '');
  v_status oyun.venue_status := coalesce((t->>'status')::oyun.venue_status, 'active'::oyun.venue_status);
  v_is_verified boolean := coalesce((t->>'isVerified')::boolean, false);
  v_commission numeric := (t->>'commissionPercent')::numeric;
  v_phone text := t->>'phone';
  v_description text := coalesce(t->>'description', '');
  v_open time := coalesce(nullif(t->>'openTime', '')::time, '06:00'::time);
  v_close time := coalesce(nullif(t->>'closeTime', '')::time, '23:00'::time);
  v_price int := coalesce((t->>'pricePerHour')::int, 1000);
  v_half_pitch boolean := coalesce((t->>'halfPitch')::boolean, false);
  v_half_percent int := coalesce((t->>'halfPricePercent')::int, 50);
  v_sport text := lower(regexp_replace(coalesce(t->'sports'->>0, 'football'), '\s+', '_', 'g'));
  r_half_a uuid;
  r_half_b uuid;
  r_court uuid;
  b_full uuid;
  b_half_a uuid;
  b_half_b uuid;
  d int;
begin
  if not exists (select 1 from oyun.sports where code = v_sport) then
    v_sport := 'football';
  end if;

  -- Upsert venue
  insert into oyun.venues (slug, name, address, timezone, status, is_verified, commission_percent, description, phone)
  values (v_slug, v_name, v_address, 'Asia/Kolkata', v_status, v_is_verified, v_commission, v_description, v_phone)
  on conflict (slug) do update set
    name = excluded.name,
    address = excluded.address,
    status = excluded.status,
    is_verified = excluded.is_verified,
    commission_percent = excluded.commission_percent,
    description = excluded.description,
    phone = excluded.phone,
    updated_at = now()
  returning id into v_id;

  -- Upsert opening hours for all 7 days (0..6)
  for d in 0..6 loop
    insert into oyun.opening_hours (venue_id, weekday, opens, closes)
    values (v_id, d::smallint, v_open, v_close)
    on conflict (venue_id, weekday, opens) do update set closes = excluded.closes;
  end loop;

  -- Multi-resource vs single-resource mapping
  if v_half_pitch then
    -- Two resources: Half A and Half B
    insert into oyun.resources (venue_id, name, sort, active)
    values (v_id, 'Pitch Half A', 0, true)
    on conflict (venue_id, name) do update set active = excluded.active
    returning id into r_half_a;

    insert into oyun.resources (venue_id, name, sort, active)
    values (v_id, 'Pitch Half B', 1, true)
    on conflict (venue_id, name) do update set active = excluded.active
    returning id into r_half_b;

    -- Bookable 1: Full pitch (occupies both)
    insert into oyun.bookables (venue_id, sport, name, slot_minutes, base_price, active, sort)
    values (v_id, v_sport, 'Full Pitch (7-a-side)', 60, v_price, true, 0)
    on conflict (venue_id, name) do update set base_price = excluded.base_price, active = excluded.active
    returning id into b_full;

    insert into oyun.bookable_resources (bookable_id, resource_id)
    values (b_full, r_half_a), (b_full, r_half_b)
    on conflict do nothing;

    -- Bookable 2: Half A
    insert into oyun.bookables (venue_id, sport, name, slot_minutes, base_price, active, sort)
    values (v_id, v_sport, 'Half Pitch A (5-a-side)', 60, round((v_price * v_half_percent) / 100.0), true, 1)
    on conflict (venue_id, name) do update set base_price = excluded.base_price, active = excluded.active
    returning id into b_half_a;

    insert into oyun.bookable_resources (bookable_id, resource_id)
    values (b_half_a, r_half_a)
    on conflict do nothing;

    -- Bookable 3: Half B
    insert into oyun.bookables (venue_id, sport, name, slot_minutes, base_price, active, sort)
    values (v_id, v_sport, 'Half Pitch B (5-a-side)', 60, round((v_price * v_half_percent) / 100.0), true, 2)
    on conflict (venue_id, name) do update set base_price = excluded.base_price, active = excluded.active
    returning id into b_half_b;

    insert into oyun.bookable_resources (bookable_id, resource_id)
    values (b_half_b, r_half_b)
    on conflict do nothing;
  else
    -- Plain turf: single court resource
    insert into oyun.resources (venue_id, name, sort, active)
    values (v_id, 'Main Court', 0, true)
    on conflict (venue_id, name) do update set active = excluded.active
    returning id into r_court;

    insert into oyun.bookables (venue_id, sport, name, slot_minutes, base_price, active, sort)
    values (v_id, v_sport, 'Standard Court', 60, v_price, true, 0)
    on conflict (venue_id, name) do update set base_price = excluded.base_price, active = excluded.active
    returning id into b_full;

    insert into oyun.bookable_resources (bookable_id, resource_id)
    values (b_full, r_court)
    on conflict do nothing;
  end if;

  return v_id;
end $$;

-- 3. Public RPC wrappers
create or replace function public.sync_turf_to_venue(turf_data jsonb)
returns uuid language sql security definer as $$
  select oyun.sync_turf_to_venue(turf_data);
$$;

create or replace function public.sync_all_turfs_to_venues()
returns integer language plpgsql security definer as $$
declare
  r record;
  cnt integer := 0;
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'turfs') then
    for r in select data from public.turfs loop
      perform oyun.sync_turf_to_venue(r.data);
      cnt := cnt + 1;
    end loop;
  end if;
  return cnt;
end $$;

grant execute on function public.sync_turf_to_venue(jsonb) to authenticated, service_role;
grant execute on function public.sync_all_turfs_to_venues() to authenticated, service_role;
