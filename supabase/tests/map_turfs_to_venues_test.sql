-- Tests for oyun.map_turf_to_venue and public venue inspection wrappers
\set ON_ERROR_STOP 1
set client_min_messages = warning;

do $$
declare
  v_plain_id uuid;
  v_half_id uuid;
  v_res_count int;
  v_book_count int;
begin
  -- 1. Plain turf
  v_plain_id := oyun.map_turf_to_venue(jsonb_build_object(
    'id', 'test-plain-turf',
    'name', 'Test Plain Turf',
    'pricePerHour', 1000,
    'sports', jsonb_build_array('Football'),
    'halfPitch', false,
    'openTime', '06:00',
    'closeTime', '23:00'
  ));

  select count(*) into v_res_count from public.get_venue_resources('test-plain-turf');
  if v_res_count <> 1 then
    raise exception 'Expected 1 resource for plain turf, got %', v_res_count;
  end if;

  select count(*) into v_book_count from public.get_venue_bookables('test-plain-turf');
  if v_book_count <> 1 then
    raise exception 'Expected 1 bookable for plain turf, got %', v_book_count;
  end if;

  -- 2. Half pitch turf
  v_half_id := oyun.map_turf_to_venue(jsonb_build_object(
    'id', 'test-half-turf',
    'name', 'Test Half Turf',
    'pricePerHour', 1200,
    'sports', jsonb_build_array('Football'),
    'halfPitch', true,
    'halfPricePercent', 55,
    'openTime', '06:00',
    'closeTime', '23:00'
  ));

  select count(*) into v_res_count from public.get_venue_resources('test-half-turf');
  if v_res_count <> 2 then
    raise exception 'Expected 2 resources for half-pitch turf, got %', v_res_count;
  end if;

  select count(*) into v_book_count from public.get_venue_bookables('test-half-turf');
  if v_book_count <> 3 then
    raise exception 'Expected 3 bookables for half-pitch turf, got %', v_book_count;
  end if;

  -- 3. Idempotency test (mapping again does not duplicate)
  perform oyun.map_turf_to_venue(jsonb_build_object(
    'id', 'test-half-turf',
    'name', 'Test Half Turf Renamed',
    'pricePerHour', 1200,
    'sports', jsonb_build_array('Football'),
    'halfPitch', true,
    'halfPricePercent', 55
  ));

  select count(*) into v_res_count from public.get_venue_resources('test-half-turf');
  if v_res_count <> 2 then
    raise exception 'Expected 2 resources after re-mapping, got %', v_res_count;
  end if;

  raise notice 'map_turfs_to_venues tests passed';
end $$;
