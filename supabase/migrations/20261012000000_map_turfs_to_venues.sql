-- OYUN data mapping: turf to venue, resources, bookables (Phase 2).
--
-- Maps existing jsonb turfs into relational venues, resources and bookables:
--   * Plain turf -> 1 resource ('Main Pitch'), 1 bookable ('Full pitch')
--   * halfPitch turf -> 'Half A', 'Half B' and 3 bookables ('Full pitch', 'Half pitch A', 'Half pitch B')
--   * Badminton/pickleball -> 'Court 1', 'Court 2' and corresponding bookables
-- Safe to run repeatedly. Server-only: RLS on, permissions granted to service_role.

create schema if not exists oyun;

insert into oyun.sports (code, name, default_slot_minutes) values
  ('football', 'Football', 60),
  ('box_cricket', 'Box Cricket', 60),
  ('badminton', 'Badminton', 60),
  ('pickleball', 'Pickleball', 30)
on conflict (code) do nothing;

create or replace function oyun.map_turf_to_venue(p_turf jsonb)
returns uuid
language plpgsql
security definer
set search_path = oyun, public
as $$
declare
  v_id uuid;
  v_slug text;
  v_name text;
  v_price int;
  v_status text;
  v_vstatus oyun.venue_status;
  v_half boolean;
  v_half_pct int;
  v_open time;
  v_close time;
  v_sports text[];
  v_primary_sport text;
  v_is_badminton boolean;
  v_is_pickleball boolean;
  v_res_main uuid;
  v_res_a uuid;
  v_res_b uuid;
  v_res_c1 uuid;
  v_res_c2 uuid;
  v_b_full uuid;
  v_b_ha uuid;
  v_b_hb uuid;
  v_b_bd1 uuid;
  v_b_bd2 uuid;
  v_b_pb1 uuid;
  v_b_pb2 uuid;
begin
  v_slug := p_turf->>'id';
  if v_slug is null or length(v_slug) = 0 then
    return null;
  end if;

  v_id := md5('oyun:venue:' || v_slug)::uuid;
  v_name := coalesce(p_turf->>'name', v_slug);
  v_price := coalesce((p_turf->>'pricePerHour')::int, 1000);
  v_status := coalesce(p_turf->>'status', 'active');
  if v_status in ('active', 'pending', 'maintenance', 'suspended') then
    v_vstatus := v_status::oyun.venue_status;
  else
    v_vstatus := 'active'::oyun.venue_status;
  end if;

  v_half := coalesce((p_turf->>'halfPitch')::boolean, false);
  v_half_pct := coalesce((p_turf->>'halfPricePercent')::int, 50);
  v_open := coalesce((p_turf->>'openTime')::time, '06:00'::time);
  v_close := coalesce((p_turf->>'closeTime')::time, '23:00'::time);

  v_sports := coalesce(array(select jsonb_array_elements_text(p_turf->'sports')), array['football']);
  v_is_badminton := ('Badminton' = any(v_sports)) or ('badminton' = any(v_sports));
  v_is_pickleball := ('Pickleball' = any(v_sports)) or ('pickleball' = any(v_sports));

  if v_is_badminton then
    v_primary_sport := 'badminton';
  elsif ('Box Cricket' = any(v_sports)) or ('box_cricket' = any(v_sports)) then
    v_primary_sport := 'box_cricket';
  else
    v_primary_sport := 'football';
  end if;

  -- 1. Insert or update venue
  insert into oyun.venues (
    id, slug, name, status, is_verified, address, phone, description, created_at, updated_at
  ) values (
    v_id,
    v_slug,
    v_name,
    v_vstatus,
    coalesce((p_turf->>'isVerified')::boolean, false),
    coalesce(p_turf->>'location', ''),
    coalesce(p_turf->>'phone', ''),
    coalesce(p_turf->>'description', ''),
    now(),
    now()
  )
  on conflict (slug) do update set
    name = excluded.name,
    status = excluded.status,
    address = excluded.address,
    phone = excluded.phone,
    description = excluded.description,
    updated_at = now();

  -- 2. Opening hours for all days
  insert into oyun.opening_hours (venue_id, weekday, opens, closes)
  select v_id, d, v_open, v_close
  from generate_series(0, 6) d
  on conflict (venue_id, weekday, opens) do update set closes = excluded.closes;

  -- 3. Resources and bookables
  if v_half then
    v_res_a := md5('oyun:res:' || v_slug || ':half_a')::uuid;
    v_res_b := md5('oyun:res:' || v_slug || ':half_b')::uuid;

    insert into oyun.resources (id, venue_id, name, sort, active) values
      (v_res_a, v_id, 'Half A', 0, true),
      (v_res_b, v_id, 'Half B', 1, true)
    on conflict (venue_id, name) do nothing;

    v_b_full := md5('oyun:b:' || v_slug || ':full')::uuid;
    v_b_ha   := md5('oyun:b:' || v_slug || ':ha')::uuid;
    v_b_hb   := md5('oyun:b:' || v_slug || ':hb')::uuid;

    insert into oyun.bookables (id, venue_id, sport, name, slot_minutes, base_price, sort, active) values
      (v_b_full, v_id, v_primary_sport, 'Full pitch', 60, v_price, 0, true),
      (v_b_ha,   v_id, v_primary_sport, 'Half pitch A', 60, round(v_price * v_half_pct / 100.0)::int, 1, true),
      (v_b_hb,   v_id, v_primary_sport, 'Half pitch B', 60, round(v_price * v_half_pct / 100.0)::int, 2, true)
    on conflict (venue_id, name) do update set base_price = excluded.base_price;

    insert into oyun.bookable_resources (bookable_id, resource_id) values
      (v_b_full, v_res_a),
      (v_b_full, v_res_b),
      (v_b_ha, v_res_a),
      (v_b_hb, v_res_b)
    on conflict do nothing;

  elsif v_is_badminton or v_is_pickleball then
    v_res_c1 := md5('oyun:res:' || v_slug || ':court_1')::uuid;
    v_res_c2 := md5('oyun:res:' || v_slug || ':court_2')::uuid;

    insert into oyun.resources (id, venue_id, name, sort, active) values
      (v_res_c1, v_id, 'Court 1', 0, true),
      (v_res_c2, v_id, 'Court 2', 1, true)
    on conflict (venue_id, name) do nothing;

    if v_is_badminton then
      v_b_bd1 := md5('oyun:b:' || v_slug || ':bd1')::uuid;
      v_b_bd2 := md5('oyun:b:' || v_slug || ':bd2')::uuid;

      insert into oyun.bookables (id, venue_id, sport, name, slot_minutes, base_price, sort, active) values
        (v_b_bd1, v_id, 'badminton', 'Badminton court 1', 60, v_price, 0, true),
        (v_b_bd2, v_id, 'badminton', 'Badminton court 2', 60, v_price, 1, true)
      on conflict (venue_id, name) do update set base_price = excluded.base_price;

      insert into oyun.bookable_resources (bookable_id, resource_id) values
        (v_b_bd1, v_res_c1),
        (v_b_bd2, v_res_c2)
      on conflict do nothing;
    end if;

    if v_is_pickleball then
      v_b_pb1 := md5('oyun:b:' || v_slug || ':pb1')::uuid;
      v_b_pb2 := md5('oyun:b:' || v_slug || ':pb2')::uuid;

      insert into oyun.bookables (id, venue_id, sport, name, slot_minutes, base_price, sort, active) values
        (v_b_pb1, v_id, 'pickleball', 'Pickleball on court 1', 30, round(v_price * 0.6)::int, 2, true),
        (v_b_pb2, v_id, 'pickleball', 'Pickleball on court 2', 30, round(v_price * 0.6)::int, 3, true)
      on conflict (venue_id, name) do update set base_price = excluded.base_price;

      insert into oyun.bookable_resources (bookable_id, resource_id) values
        (v_b_pb1, v_res_c1),
        (v_b_pb2, v_res_c2)
      on conflict do nothing;
    end if;

  else
    v_res_main := md5('oyun:res:' || v_slug || ':main')::uuid;

    insert into oyun.resources (id, venue_id, name, sort, active) values
      (v_res_main, v_id, 'Main Pitch', 0, true)
    on conflict (venue_id, name) do nothing;

    v_b_full := md5('oyun:b:' || v_slug || ':full')::uuid;

    insert into oyun.bookables (id, venue_id, sport, name, slot_minutes, base_price, sort, active) values
      (v_b_full, v_id, v_primary_sport, 'Full pitch', 60, v_price, 0, true)
    on conflict (venue_id, name) do update set base_price = excluded.base_price;

    insert into oyun.bookable_resources (bookable_id, resource_id) values
      (v_b_full, v_res_main)
    on conflict do nothing;
  end if;

  return v_id;
end;
$$;

-- Migrate any turfs from public.turfs if table exists
do $$
declare
  r record;
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'turfs') then
    for r in select data from public.turfs loop
      perform oyun.map_turf_to_venue(r.data);
    end loop;
  end if;
end $$;

-- ───────────────────────── public wrappers ─────────────────────────

create or replace function public.get_venue_resources(p_venue_slug text)
returns table (id uuid, name text, sort smallint, active boolean)
language sql
stable
security definer
set search_path = oyun, public
as $$
  select r.id, r.name, r.sort, r.active
  from oyun.resources r
  join oyun.venues v on v.id = r.venue_id
  where v.slug = p_venue_slug
  order by r.sort, r.name;
$$;

create or replace function public.get_venue_bookables(p_venue_slug text)
returns table (
  id uuid,
  name text,
  sport text,
  slot_minutes int,
  base_price int,
  sort smallint,
  active boolean,
  resource_names text[]
)
language sql
stable
security definer
set search_path = oyun, public
as $$
  select
    b.id,
    b.name,
    b.sport,
    b.slot_minutes,
    b.base_price,
    b.sort,
    b.active,
    array_agg(r.name order by r.sort) as resource_names
  from oyun.bookables b
  join oyun.venues v on v.id = b.venue_id
  left join oyun.bookable_resources br on br.bookable_id = b.id
  left join oyun.resources r on r.id = br.resource_id
  where v.slug = p_venue_slug
  group by b.id, b.name, b.sport, b.slot_minutes, b.base_price, b.sort, b.active
  order by b.sort, b.name;
$$;

-- Permissions for public wrappers
revoke all on function public.get_venue_resources(text) from public;
revoke all on function public.get_venue_bookables(text) from public;

do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.get_venue_resources(text) from anon;
    revoke all on function public.get_venue_bookables(text) from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function public.get_venue_resources(text) from authenticated;
    revoke all on function public.get_venue_bookables(text) from authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.get_venue_resources(text) to service_role;
    grant execute on function public.get_venue_bookables(text) to service_role;
  end if;
end $$;
