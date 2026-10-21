\set ON_ERROR_STOP 1
-- erase_account anonymises every booking of the account and removes the player, but keeps money and slots
insert into oyun.sports values ('football','Football',60) on conflict do nothing;
insert into oyun.venues (id, slug, name, status) values ('00000000-0000-0000-0000-0000000000f1','er-venue','ER Venue','active');
insert into oyun.opening_hours select '00000000-0000-0000-0000-0000000000f1', d, '06:00', '23:00' from generate_series(0,6) d;
insert into oyun.resources (id, venue_id, name) values ('00000000-0000-0000-0000-0000000000f2','00000000-0000-0000-0000-0000000000f1','Pitch');
insert into oyun.bookables (id, venue_id, sport, name, slot_minutes, base_price) values
  ('00000000-0000-0000-0000-0000000000f3','00000000-0000-0000-0000-0000000000f1','football','Full',60,1000);
insert into oyun.bookable_resources values ('00000000-0000-0000-0000-0000000000f3','00000000-0000-0000-0000-0000000000f2');
insert into oyun.players (id, legacy_id, clerk_user_id, name, phone) values
  ('00000000-0000-0000-0000-0000000000a1','pl_er1','user_er1','Asha','9876511111'),
  ('00000000-0000-0000-0000-0000000000a2','pl_er2','user_er2','Other','9876522222');

do $$
declare
  day date := (now() at time zone 'Asia/Kolkata')::date + 1;
  s timestamptz; h uuid; n int; a int; b record;
begin
  -- two bookings for Asha (one linked by player, one only by meta.accountId), one for someone else
  s := ((day + time '10:00')::timestamp at time zone 'Asia/Kolkata');
  h := oyun.hold_slots('er-h1', '00000000-0000-0000-0000-0000000000f3', array[s]);
  perform oyun.confirm_hold_priced(h, 'er-h1', 'Asha K', '9876511111', '{"total":900,"amountPaid":900,"legacyId":"bk_er_1","meta":{"review":{"rating":5,"name":"Asha K"}}}', '00000000-0000-0000-0000-0000000000a1');
  h := oyun.hold_slots('er-h2', '00000000-0000-0000-0000-0000000000f3', array[s + interval '2 hours']);
  perform oyun.confirm_hold_priced(h, 'er-h2', 'Asha K', '9876511111', '{"total":800,"legacyId":"bk_er_2","meta":{"accountId":"user_er1"}}');
  h := oyun.hold_slots('er-h3', '00000000-0000-0000-0000-0000000000f3', array[s + interval '4 hours']);
  perform oyun.confirm_hold_priced(h, 'er-h3', 'Other P', '9876522222', '{"total":700,"legacyId":"bk_er_3"}', '00000000-0000-0000-0000-0000000000a2');

  n := public.erase_account('user_er1', 'pl_er1');
  if n <> 2 then raise exception 'FAIL: expected 2 bookings erased, got %', n; end if;
  for b in select * from oyun.bookings where legacy_id in ('bk_er_1','bk_er_2') loop
    if b.customer_name <> 'Deleted Player' or b.customer_phone <> '0000000000' or b.player_id is not null or b.meta ? 'accountId' then
      raise exception 'FAIL: not anonymised: %', row_to_json(b);
    end if;
  end loop;
  if (select meta->'review'->>'name' from oyun.bookings where legacy_id = 'bk_er_1') <> 'Verified Player' then raise exception 'FAIL: review name'; end if;
  if (select total from oyun.bookings where legacy_id = 'bk_er_1') <> 900 or (select amount_paid from oyun.bookings where legacy_id = 'bk_er_1') <> 900 then
    raise exception 'FAIL: money changed';
  end if;
  if exists (select 1 from oyun.players where id = '00000000-0000-0000-0000-0000000000a1') then raise exception 'FAIL: player not removed'; end if;
  if (select customer_name from oyun.bookings where legacy_id = 'bk_er_3') <> 'Other P' or not exists (select 1 from oyun.players where id = '00000000-0000-0000-0000-0000000000a2') then
    raise exception 'FAIL: another account was touched';
  end if;
  if (select count(*) from oyun.slot_claims c join oyun.booking_items i on i.id = c.booking_item_id join oyun.bookings k on k.id = i.booking_id where k.legacy_id in ('bk_er_1','bk_er_2') and c.released_at is null) <> 2 then
    raise exception 'FAIL: slots released by erase';
  end if;
  a := public.erase_account('user_er1', 'pl_er1');
  if a <> 0 then raise exception 'FAIL: second erase changed % rows', a; end if;

  -- a player still referenced elsewhere is anonymised instead of deleted
  insert into oyun.wallet_ledger (player_id, amount, kind) values ('00000000-0000-0000-0000-0000000000a2', 50, 'cashback');
  perform public.erase_account('user_er2', 'pl_er2');
  if (select name from oyun.players where id = '00000000-0000-0000-0000-0000000000a2') <> 'Deleted Player' then raise exception 'FAIL: referenced player not anonymised'; end if;
  begin
    perform public.erase_account('', null);
    raise exception 'FAIL: empty request accepted';
  exception when sqlstate 'P0001' then null; end;
  raise notice 'erase_account tests passed';
end $$;
