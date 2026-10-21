\set ON_ERROR_STOP 1
-- book_ranges and move_booking: arbitrary ranges, no double bookings, a failed move leaves the booking in place
insert into oyun.sports values ('football','Football',60) on conflict do nothing;
insert into oyun.venues (id, slug, name, status) values ('00000000-0000-0000-0000-0000000000e1','bm-venue','BM Venue','active');
insert into oyun.opening_hours select '00000000-0000-0000-0000-0000000000e1', d, '06:00', '23:00' from generate_series(0,6) d;
insert into oyun.resources (id, venue_id, name) values ('00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000e1','Pitch');
insert into oyun.bookables (id, venue_id, sport, name, slot_minutes, base_price) values
  ('00000000-0000-0000-0000-0000000000e3','00000000-0000-0000-0000-0000000000e1','football','Full',60,1000);
insert into oyun.bookable_resources values ('00000000-0000-0000-0000-0000000000e3','00000000-0000-0000-0000-0000000000e2');

do $$
declare
  day date := (now() at time zone 'Asia/Kolkata')::date + 2;
  t1 timestamptz := ((day + time '17:15')::timestamp at time zone 'Asia/Kolkata');  -- 17:15, off the hourly grid
  bk oyun.bookings; moved oyun.bookings; other oyun.bookings; first_start timestamptz; n int;
begin
  -- a 90-minute walk-in starting at 17:15
  bk := oyun.book_ranges('00000000-0000-0000-0000-0000000000e3', array[tstzrange(t1, t1 + interval '90 minutes')],
    'Desk', '9876543210', '{"total":1500,"amountPaid":1500,"source":"walk_in","legacyId":"bk_bm_1"}');
  if bk.status <> 'confirmed' or bk.source <> 'walk_in' or bk.total <> 1500 then raise exception 'FAIL: booking: %', row_to_json(bk); end if;
  select (select price from oyun.booking_items where booking_id = bk.id) into n;
  if n <> 1500 then raise exception 'FAIL: pro-rata item price %', n; end if;

  begin
    perform oyun.book_ranges('00000000-0000-0000-0000-0000000000e3', array[tstzrange(t1 + interval '60 minutes', t1 + interval '120 minutes')],
      'X', '9876543211', '{"total":1}');
    raise exception 'FAIL: overlapping range accepted';
  exception when sqlstate 'P0001' then null; end;
  begin
    perform oyun.book_ranges('00000000-0000-0000-0000-0000000000e3', array[tstzrange(t1, t1 - interval '1 hour')], 'X', '9876543211', '{"total":1}');
    raise exception 'FAIL: inverted range accepted';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin
    perform oyun.book_ranges('00000000-0000-0000-0000-0000000000e3',
      array[tstzrange(((day + time '03:00')::timestamp at time zone 'Asia/Kolkata'), ((day + time '04:00')::timestamp at time zone 'Asia/Kolkata'))],
      'X', '9876543211', '{"total":1}');
    raise exception 'FAIL: closed hours accepted';
  exception when sqlstate 'P0001' then null; end;

  -- a second booking, then move the first onto it: refused, and the first stays put
  other := oyun.book_ranges('00000000-0000-0000-0000-0000000000e3',
    array[tstzrange(t1 + interval '3 hours', t1 + interval '4 hours')], 'Y', '9876543212', '{"total":1000,"legacyId":"bk_bm_2"}');
  begin
    perform oyun.move_booking('bk_bm_1', t1 + interval '3 hours');
    raise exception 'FAIL: move onto a taken slot accepted';
  exception when sqlstate 'P0001' then null; end;
  select lower(during) into first_start from oyun.booking_items where booking_id = bk.id;
  if first_start <> t1 then raise exception 'FAIL: failed move changed the booking (%).', first_start; end if;

  -- a free target works, keeps the 90 minute length, and frees the old slot
  moved := oyun.move_booking('bk_bm_1', t1 - interval '2 hours');
  select lower(during) into first_start from oyun.booking_items where booking_id = bk.id;
  if first_start <> t1 - interval '2 hours' then raise exception 'FAIL: not moved: %', first_start; end if;
  if (select upper(during) - lower(during) from oyun.booking_items where booking_id = bk.id) <> interval '90 minutes' then
    raise exception 'FAIL: length changed';
  end if;
  perform oyun.book_ranges('00000000-0000-0000-0000-0000000000e3', array[tstzrange(t1, t1 + interval '60 minutes')], 'Z', '9876543213', '{"total":1000}');
  begin
    perform oyun.move_booking('bk_missing', t1);
    raise exception 'FAIL: unknown booking accepted';
  exception when sqlstate 'P0002' then null; end;
  raise notice 'book_ranges and move_booking tests passed';
end $$;
