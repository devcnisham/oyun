-- Tests for public RPC wrappers in supabase/migrations/20261011000000_slot_booking_v2.sql.
-- Run against a database with migrations applied (scripts/sql-tests.sh does this).
\set ON_ERROR_STOP on

do $$
declare
  v_venue uuid := '00000000-0000-0000-0000-000000000099'::uuid;
  v_res   uuid := '00000000-0000-0000-0000-00000000009a'::uuid;
  v_book  uuid := '00000000-0000-0000-0000-00000000009b'::uuid;
  v_tomorrow date := (now() at time zone 'Asia/Kolkata')::date + 1;
  v_slot_start timestamptz;
  v_hold_id uuid;
  v_bk oyun.bookings;
  v_price int;
  v_slots_count int;
  v_block_id uuid;
  v_err boolean := false;
begin
  -- Fixtures in oyun schema
  insert into oyun.sports (code, name, default_slot_minutes)
  values ('football', 'Football', 60)
  on conflict (code) do nothing;

  insert into oyun.venues (id, slug, name, status, timezone)
  values (v_venue, 'wrapper-test-turf', 'Wrapper Test Turf', 'active', 'Asia/Kolkata')
  on conflict (id) do nothing;

  insert into oyun.opening_hours (venue_id, weekday, opens, closes)
  select v_venue, d, '06:00'::time, '23:00'::time
    from generate_series(0, 6) d
  on conflict do nothing;

  insert into oyun.resources (id, venue_id, name)
  values (v_res, v_venue, 'Pitch 1')
  on conflict (id) do nothing;

  insert into oyun.bookables (id, venue_id, sport, name, slot_minutes, base_price)
  values (v_book, v_venue, 'football', 'Pitch 1 Full', 60, 1000)
  on conflict (id) do nothing;

  insert into oyun.bookable_resources (bookable_id, resource_id)
  values (v_book, v_res)
  on conflict do nothing;

  v_slot_start := ((v_tomorrow + '10:00'::time)::timestamp at time zone 'Asia/Kolkata');

  -- 1. public.slot_price wrapper
  v_price := public.slot_price(v_book, v_slot_start);
  assert v_price = 1000, 'public.slot_price should return 1000, got ' || v_price;

  -- 2. public.available_slots wrapper
  select count(*) into v_slots_count from public.available_slots(v_book, v_tomorrow);
  assert v_slots_count > 0, 'public.available_slots should return available slots';

  -- 3. public.hold_slots wrapper
  v_hold_id := public.hold_slots('tester_dev1', v_book, array[v_slot_start]);
  assert v_hold_id is not null, 'public.hold_slots should return hold id';

  -- Duplicate hold should fail with slot_taken
  begin
    perform public.hold_slots('tester_dev2', v_book, array[v_slot_start]);
  exception when others then
    v_err := true;
  end;
  assert v_err, 'second hold on same slot should fail';

  -- 4. public.confirm_hold wrapper
  v_bk := public.confirm_hold(v_hold_id, 'tester_dev1', 'Player One', '9876543210');
  assert v_bk.status = 'confirmed', 'public.confirm_hold should transition to confirmed';

  -- 5. public.cancel_booking wrapper
  perform public.cancel_booking(v_hold_id, 'test cancellation');
  select * into v_bk from oyun.bookings where id = v_hold_id;
  assert v_bk.status = 'cancelled', 'public.cancel_booking should set status to cancelled';

  -- 6. public.block_slot wrapper on 14:00-15:00
  v_slot_start := ((v_tomorrow + '14:00'::time)::timestamp at time zone 'Asia/Kolkata');
  v_block_id := public.block_slot(v_book, tstzrange(v_slot_start, v_slot_start + interval '1 hour'), 'pitch maintenance');
  assert v_block_id is not null, 'public.block_slot should succeed';

  -- 7. public.expire_holds wrapper
  perform public.expire_holds();

end $$;

-- Check function privileges on public wrappers
do $$
begin
  assert has_function_privilege('service_role', 'public.hold_slots(text, uuid, timestamptz[], uuid, interval)', 'execute'),
    'service_role must have execute on public.hold_slots';
  assert has_function_privilege('service_role', 'public.confirm_hold(uuid, text, text, text, boolean, interval)', 'execute'),
    'service_role must have execute on public.confirm_hold';
  assert has_function_privilege('service_role', 'public.available_slots(uuid, date)', 'execute'),
    'service_role must have execute on public.available_slots';

  if exists (select 1 from pg_roles where rolname = 'anon') then
    assert not has_function_privilege('anon', 'public.hold_slots(text, uuid, timestamptz[], uuid, interval)', 'execute'),
      'anon must not have execute on public.hold_slots';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    assert not has_function_privilege('authenticated', 'public.hold_slots(text, uuid, timestamptz[], uuid, interval)', 'execute'),
      'authenticated must not have execute on public.hold_slots';
  end if;
end $$;

-- Clean up test fixtures
delete from oyun.venues where id = '00000000-0000-0000-0000-000000000099'::uuid;

select 'slot booking v2 wrapper tests passed' as result;
