\set ON_ERROR_STOP 1
-- apply_booking_updates edits existing bookings only, and cancelling frees the slot
insert into oyun.sports values ('football','Football',60) on conflict do nothing;
insert into oyun.venues (id, slug, name, status) values ('00000000-0000-0000-0000-0000000000d1','bu-venue','BU Venue','active');
insert into oyun.opening_hours select '00000000-0000-0000-0000-0000000000d1', d, '00:00', '23:59' from generate_series(0,6) d;
insert into oyun.resources (id, venue_id, name) values ('00000000-0000-0000-0000-0000000000d2','00000000-0000-0000-0000-0000000000d1','Pitch');
insert into oyun.bookables (id, venue_id, sport, name, slot_minutes, base_price) values
  ('00000000-0000-0000-0000-0000000000d3','00000000-0000-0000-0000-0000000000d1','football','Full',60,1000);
insert into oyun.bookable_resources values ('00000000-0000-0000-0000-0000000000d3','00000000-0000-0000-0000-0000000000d2');

do $$
declare
  start_at timestamptz := ((((now() at time zone 'Asia/Kolkata')::date + 1) + time '19:00')::timestamp at time zone 'Asia/Kolkata');
  bid uuid; bk oyun.bookings; n int; again uuid;
begin
  bid := oyun.hold_slots('h1', '00000000-0000-0000-0000-0000000000d3', array[start_at]);
  begin
    perform oyun.apply_booking_updates(jsonb_build_array(jsonb_build_object('id', 'bk_bu_1', 'status', 'checked_in')));
    raise exception 'FAIL: update of an unknown booking accepted';
  exception when sqlstate 'P0002' then null; end;
  begin
    perform oyun.apply_booking_updates(jsonb_build_array(jsonb_build_object('id', bid::text, 'status', 'checked_in')));
    raise exception 'FAIL: update of a held booking accepted';
  exception when sqlstate 'P0001' then null; end;

  perform oyun.confirm_hold_priced(bid, 'h1', 'Asha', '9876543210', '{"total":1000,"legacyId":"bk_bu_1"}');
  begin
    perform oyun.apply_booking_updates(jsonb_build_array(jsonb_build_object('id', 'bk_bu_1', 'status', 'bogus')));
    raise exception 'FAIL: bad status accepted';
  exception when sqlstate 'P0001' then null; end;
  begin
    perform oyun.apply_booking_updates(jsonb_build_array(jsonb_build_object('id', 'bk_bu_1', 'amountPaid', -1)));
    raise exception 'FAIL: negative amount accepted';
  exception when sqlstate 'P0001' then null; end;

  n := oyun.apply_booking_updates(jsonb_build_array(jsonb_build_object(
    'id', 'bk_bu_1', 'status', 'checked_in', 'amountPaid', 1000, 'checkedInAt', '2026-10-20T13:00:00Z',
    'meta', jsonb_build_object('cashback', 20))));
  select * into bk from oyun.bookings where id = bid;
  if n <> 1 or bk.status <> 'checked_in' or bk.amount_paid <> 1000 or bk.meta->>'cashback' <> '20' or bk.checked_in_at is null then
    raise exception 'FAIL: update not applied: %', row_to_json(bk);
  end if;
  if bk.total <> 1000 then raise exception 'FAIL: unrelated column changed'; end if;
  -- meta merges instead of replacing
  perform oyun.apply_booking_updates(jsonb_build_array(jsonb_build_object('id', bid::text, 'meta', jsonb_build_object('paymentMode', 'cash'))));
  select * into bk from oyun.bookings where id = bid;
  if bk.meta->>'cashback' <> '20' or bk.meta->>'paymentMode' <> 'cash' then raise exception 'FAIL: meta not merged: %', bk.meta; end if;

  -- cancelling frees the slot for someone else
  begin
    perform oyun.hold_slots('h2', '00000000-0000-0000-0000-0000000000d3', array[start_at]);
    raise exception 'FAIL: slot was not taken';
  exception when exclusion_violation or sqlstate 'P0001' then null; end;
  perform oyun.apply_booking_updates(jsonb_build_array(jsonb_build_object('id', 'bk_bu_1', 'status', 'cancelled', 'cancelReason', 'rain')));
  again := oyun.hold_slots('h2', '00000000-0000-0000-0000-0000000000d3', array[start_at]);
  if again is null then raise exception 'FAIL: slot not freed by cancel'; end if;
  raise notice 'apply_booking_updates tests passed';
end $$;
