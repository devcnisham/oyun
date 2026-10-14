-- Tests for data mapping from turfs to venues, resources, and bookables (#134)
\set ON_ERROR_STOP on

begin;

-- 1. Sync a plain turf
select public.sync_turf_to_venue('{
  "id": "turf_plain_test",
  "name": "Plain Arena",
  "location": "Kodialbail, Mangalore",
  "pricePerHour": 1200,
  "sports": ["Football"],
  "openTime": "06:00",
  "closeTime": "23:00",
  "halfPitch": false
}'::jsonb);

-- Verify venue exists
do $$
declare
  v_id uuid;
  r_count int;
  b_count int;
begin
  select id into v_id from oyun.venues where slug = 'turf_plain_test';
  if v_id is null then raise exception 'FAIL: venue not found'; end if;

  select count(*) into r_count from oyun.resources where venue_id = v_id;
  if r_count != 1 then raise exception 'FAIL: expected 1 resource, got %', r_count; end if;

  select count(*) into b_count from oyun.bookables where venue_id = v_id;
  if b_count != 1 then raise exception 'FAIL: expected 1 bookable, got %', b_count; end if;

  raise notice 'ok: plain turf mapped to 1 resource and 1 bookable';
end $$;

-- 2. Sync a half-pitch turf
select public.sync_turf_to_venue('{
  "id": "turf_half_test",
  "name": "Split Pitch Arena",
  "location": "Kankanady, Mangalore",
  "pricePerHour": 1400,
  "halfPitch": true,
  "halfPricePercent": 60,
  "sports": ["Football"],
  "openTime": "07:00",
  "closeTime": "22:00"
}'::jsonb);

-- Verify half-pitch venue resources and bookables
do $$
declare
  v_id uuid;
  r_count int;
  b_count int;
  br_full_count int;
  b_full_id uuid;
begin
  select id into v_id from oyun.venues where slug = 'turf_half_test';
  if v_id is null then raise exception 'FAIL: half venue not found'; end if;

  select count(*) into r_count from oyun.resources where venue_id = v_id;
  if r_count != 2 then raise exception 'FAIL: expected 2 resources, got %', r_count; end if;

  select count(*) into b_count from oyun.bookables where venue_id = v_id;
  if b_count != 3 then raise exception 'FAIL: expected 3 bookables, got %', b_count; end if;

  select id into b_full_id from oyun.bookables where venue_id = v_id and name like 'Full Pitch%';
  select count(*) into br_full_count from oyun.bookable_resources where bookable_id = b_full_id;
  if br_full_count != 2 then raise exception 'FAIL: full pitch bookable must occupy 2 resources, got %', br_full_count; end if;

  raise notice 'ok: half-pitch turf mapped to 2 resources and 3 bookables';
end $$;

rollback;
