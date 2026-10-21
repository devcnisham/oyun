\set ON_ERROR_STOP 1
-- Backfill copies legacy bookings into oyun, reports what it cannot, is repeatable, and parity agrees afterwards
-- earlier tests leave bookings with legacy ids; parity compares the whole table
delete from oyun.bookings where legacy_id is not null;

select public.sync_turf_to_venue('{"id":"bf_turf","name":"BF Turf","location":"Kodialbail","pricePerHour":1000,"sports":["Football"],"openTime":"06:00","closeTime":"23:30","halfPitch":true}'::jsonb);
select public.sync_turf_to_venue('{"id":"bf_late","name":"BF Late","location":"Ullal","pricePerHour":800,"sports":["Football"],"openTime":"18:00","closeTime":"06:00","halfPitch":false}'::jsonb);

insert into public.players (id, data) values
  ('pl_bf1', '{"id":"pl_bf1","name":"Asha","phone":"9876500001","status":"active","accountId":"user_bf1","createdAt":"2026-09-01T10:00:00Z"}'),
  ('pl_bf2', '{"id":"pl_bf2","name":"Bad Phone","phone":"123","status":"active"}');

insert into public.bookings (id, data) values
  ('bk_bf_1', '{"id":"bk_bf_1","code":"SA-BF0001","turfId":"bf_turf","date":"2026-10-20","hour":18,"hours":[18],"status":"confirmed","customerName":"Asha","customerPhone":"9876500001","playerId":"pl_bf1","source":"online","amountPaid":100,"paymentMode":"venue","addOns":[{"id":"a","name":"Ball","price":50,"qty":1}],"pricing":{"subtotal":1000,"total":950,"walletDeduction":50,"advance":100,"slotPrice":1000},"createdAt":"2026-10-10T08:00:00Z"}'),
  ('bk_bf_2', '{"id":"bk_bf_2","code":"SA-BF0002","turfId":"bf_turf","date":"2026-10-21","hour":19,"hours":[19,20],"status":"checked_in","customerName":"Ravi","customerPhone":"9876500002","source":"online","amountPaid":2000,"checkedInAt":"2026-10-21T13:30:00Z","cashback":20,"pricing":{"subtotal":2000,"total":2000,"slotPrice":1000},"items":[{"id":"i1","hour":19,"durationMinutes":60,"startMinute":0,"price":1000},{"id":"i2","hour":20,"durationMinutes":60,"startMinute":0,"price":1000}]}'),
  ('bk_bf_3', '{"id":"bk_bf_3","code":"SA-BF0003","turfId":"bf_turf","date":"2026-10-22","hour":17,"pitch":"B","status":"refunded","customerName":"Meena","customerPhone":"9876500003","source":"online","amountPaid":550,"cancelledAt":"2026-10-20T09:00:00Z","cancelReason":"rain","pricing":{"subtotal":550,"total":550,"slotPrice":550}}'),
  ('bk_bf_4', '{"id":"bk_bf_4","code":"SA-BF0004","turfId":"bf_late","date":"2026-10-20","hour":24,"status":"confirmed","customerName":"Late","customerPhone":"9876500004","source":"walk_in","amountPaid":800,"pricing":{"subtotal":800,"total":800,"slotPrice":800}}'),
  ('bk_bf_5', '{"id":"bk_bf_5","code":"SA-BF0005","turfId":"missing_turf","date":"2026-10-20","hour":18,"status":"confirmed","customerName":"X","customerPhone":"9876500005","pricing":{"total":1}}'),
  -- overlaps bk_bf_1 (18:00-19:00 full pitch) through a 90 minute walk-in starting 18:30 at hour 18? use hour 19 minute 0 start 18:30 -> hour 18 index clash, so start at hour 17 for 120 minutes (17:00-19:00)
  ('bk_bf_6', '{"id":"bk_bf_6","code":"SA-BF0006","turfId":"bf_turf","date":"2026-10-20","hour":17,"durationMinutes":120,"status":"confirmed","customerName":"Dup","customerPhone":"9876500006","source":"walk_in","amountPaid":2000,"pricing":{"subtotal":2000,"total":2000}}');

do $$
declare r jsonb; again jsonb; p jsonb; n int; b oyun.bookings; s timestamptz;
begin
  r := public.backfill_legacy_bookings(true);
  if (r->>'inserted')::int <> 5 then raise exception 'FAIL: dry run counts: %', r; end if;
  if (select count(*) from oyun.bookings where legacy_id is not null) <> 0 then raise exception 'FAIL: dry run wrote rows'; end if;
  if r->'noVenue' <> '["bk_bf_5"]'::jsonb then raise exception 'FAIL: noVenue: %', r; end if;
  if r->'claimConflicts' <> '["bk_bf_6"]'::jsonb then raise exception 'FAIL: claim conflict not reported: %', r; end if;
  if (r->'errors') <> '[]'::jsonb then raise exception 'FAIL: errors: %', r->'errors'; end if;

  r := public.backfill_legacy_bookings(false);
  if (r->>'inserted')::int <> 5 or (r->>'players')::int <> 1 then raise exception 'FAIL: real run: %', r; end if;
  again := public.backfill_legacy_bookings(false);
  if (again->>'inserted')::int <> 0 or (again->>'alreadyThere')::int <> 5 then raise exception 'FAIL: not repeatable: %', again; end if;

  select * into b from oyun.bookings where legacy_id = 'bk_bf_1';
  if b.status <> 'confirmed' or b.total <> 950 or b.wallet_used <> 50 or b.amount_paid <> 100 or b.code <> 'SA-BF0001'
     or b.meta->'addOns' is null or b.player_id is null or b.customer_phone <> '9876500001' then
    raise exception 'FAIL: booking 1: %', row_to_json(b);
  end if;
  select lower(during) into s from oyun.booking_items where booking_id = b.id;
  if s <> '2026-10-20 18:00+05:30'::timestamptz then raise exception 'FAIL: slot start %', s; end if;

  select * into b from oyun.bookings where legacy_id = 'bk_bf_2';
  select count(*) into n from oyun.booking_items where booking_id = b.id;
  if n <> 2 or b.status <> 'checked_in' or b.meta->>'cashback' <> '20' then raise exception 'FAIL: booking 2: %', row_to_json(b); end if;

  select * into b from oyun.bookings where legacy_id = 'bk_bf_3';
  if b.status <> 'cancelled' or b.meta->>'refunded' <> 'true' or b.cancel_reason <> 'rain' then raise exception 'FAIL: booking 3: %', row_to_json(b); end if;
  if not exists (select 1 from oyun.booking_items i join oyun.bookables k on k.id = i.bookable_id where i.booking_id = b.id and k.name like 'Half Pitch B%') then
    raise exception 'FAIL: half pitch B not used';
  end if;
  if exists (select 1 from oyun.slot_claims c join oyun.booking_items i on i.id = c.booking_item_id where i.booking_id = b.id and c.released_at is null) then
    raise exception 'FAIL: cancelled booking holds a live claim';
  end if;

  -- hour 24 at a venue open 18:00-06:00 is 00:00 the next day
  select * into b from oyun.bookings where legacy_id = 'bk_bf_4';
  select lower(during) into s from oyun.booking_items where booking_id = b.id;
  if s <> '2026-10-21 00:00+05:30'::timestamptz or b.source <> 'walk_in' then raise exception 'FAIL: after midnight: % %', s, b.source; end if;

  -- the clashing booking exists but does not hold the slot
  select * into b from oyun.bookings where legacy_id = 'bk_bf_6';
  if b.id is null then raise exception 'FAIL: conflicting booking was dropped'; end if;
  if exists (select 1 from oyun.slot_claims c join oyun.booking_items i on i.id = c.booking_item_id where i.booking_id = b.id and c.released_at is null) then
    raise exception 'FAIL: conflicting booking holds a live claim';
  end if;

  p := public.parity_report();
  if (p->>'ok')::boolean then raise exception 'FAIL: parity should flag the booking with no venue: %', p; end if;
  if p->'missingFromOyun' <> '["bk_bf_5"]'::jsonb then raise exception 'FAIL: missing list: %', p; end if;
  delete from public.bookings where id = 'bk_bf_5';
  p := public.parity_report();
  if not (p->>'ok')::boolean then raise exception 'FAIL: parity differs after removing the unmappable booking: %', p; end if;
  raise notice 'backfill tests passed';
end $$;
