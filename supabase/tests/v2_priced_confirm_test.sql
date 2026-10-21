\set ON_ERROR_STOP 1
-- confirm_hold_priced stores the quote on the booking and refuses bad quotes
insert into oyun.sports values ('football','Football',60) on conflict do nothing;
insert into oyun.venues (id, slug, name, status) values ('00000000-0000-0000-0000-0000000000c1','pc-venue','PC Venue','active');
insert into oyun.opening_hours select '00000000-0000-0000-0000-0000000000c1', d, '00:00', '23:59' from generate_series(0,6) d;
insert into oyun.resources (id, venue_id, name) values ('00000000-0000-0000-0000-0000000000c2','00000000-0000-0000-0000-0000000000c1','Pitch');
insert into oyun.bookables (id, venue_id, sport, name, slot_minutes, base_price) values
  ('00000000-0000-0000-0000-0000000000c3','00000000-0000-0000-0000-0000000000c1','football','Full',60,1000);
insert into oyun.bookable_resources values ('00000000-0000-0000-0000-0000000000c3','00000000-0000-0000-0000-0000000000c2');

do $$
declare
  start_at timestamptz := ((((now() at time zone 'Asia/Kolkata')::date + 1) + time '18:00')::timestamp at time zone 'Asia/Kolkata');
  bid uuid; bk oyun.bookings; ok boolean;
begin
  bid := oyun.hold_slots('h1', '00000000-0000-0000-0000-0000000000c3', array[start_at]);
  begin
    perform oyun.confirm_hold_priced(bid, 'h1', 'A', '9876543210', '{"total":100,"amountPaid":200}');
    raise exception 'FAIL: paid above total accepted';
  exception when sqlstate 'P0001' then null; end;
  begin
    perform oyun.confirm_hold_priced(bid, 'h1', 'A', '9876543210', '{"total":100,"discount":-5}');
    raise exception 'FAIL: negative discount accepted';
  exception when sqlstate 'P0001' then null; end;
  begin
    perform oyun.confirm_hold_priced(bid, 'other', 'A', '9876543210', '{"total":100}');
    raise exception 'FAIL: wrong holder accepted';
  exception when sqlstate 'P0002' then null; end;

  bk := oyun.confirm_hold_priced(bid, 'h1', 'Asha', '9876543210',
    '{"subtotal":1000,"discount":100,"walletUsed":50,"total":850,"advanceDue":150,"amountPaid":150,
      "priceBreakdown":{"gst":0},"meta":{"addOns":["ball"]},"legacyId":"bk_legacy_1"}');
  ok := bk.status = 'confirmed' and bk.total = 850 and bk.wallet_used = 50 and bk.amount_paid = 150
        and bk.meta->'addOns' = '["ball"]'::jsonb and bk.legacy_id = 'bk_legacy_1' and bk.hold_expires_at is null;
  if not ok then raise exception 'FAIL: quote not stored: %', row_to_json(bk); end if;
  begin
    perform oyun.confirm_hold_priced(bid, 'h1', 'Asha', '9876543210', '{"total":1}');
    raise exception 'FAIL: confirming twice accepted';
  exception when sqlstate 'P0001' then null; end;
  raise notice 'confirm_hold_priced tests passed';
end $$;
