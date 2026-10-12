-- Tests for the money guards in supabase/migrations/20261009000000_check_constraints.sql.
-- Run against a store database that has the migrations applied (scripts/sql-tests.sh does this).
\set ON_ERROR_STOP on

create or replace function pg_temp.expect_fail(label text, stmt text) returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'FAIL: % was accepted', label;
exception when check_violation then
  raise notice 'ok: % refused', label;
end $$;

create or replace function pg_temp.expect_ok(label text, stmt text) returns void language plpgsql as $$
begin
  execute stmt;
  raise notice 'ok: % accepted', label;
end $$;

begin;
select pg_temp.expect_ok('wallet of 0',        $$insert into public.players (id, data) values ('p_ok', '{"walletBalance": 0, "phone": "9000000001"}')$$);
select pg_temp.expect_ok('player without a balance field', $$insert into public.players (id, data) values ('p_none', '{"phone": "9000000002"}')$$);
select pg_temp.expect_fail('negative wallet',  $$insert into public.players (id, data) values ('p_bad', '{"walletBalance": -1, "phone": "9000000003"}')$$);
select pg_temp.expect_fail('wallet pushed below zero by an update', $$update public.players set data = jsonb_set(data, '{walletBalance}', '-50') where id = 'p_ok'$$);

select pg_temp.expect_ok('booking with amounts', $$insert into public.bookings (id, data) values ('b_ok', '{"turfId":"t","date":"2026-10-12","hour":18,"status":"confirmed","code":"SA-OK1","amountPaid":0,"pricing":{"total":900,"walletDeduction":100}}')$$);
select pg_temp.expect_fail('negative amountPaid',   $$insert into public.bookings (id, data) values ('b_bad1', '{"turfId":"t","date":"2026-10-12","hour":19,"status":"confirmed","code":"SA-BAD1","amountPaid":-1,"pricing":{"total":900,"walletDeduction":0}}')$$);
select pg_temp.expect_fail('negative total',        $$insert into public.bookings (id, data) values ('b_bad2', '{"turfId":"t","date":"2026-10-12","hour":20,"status":"confirmed","code":"SA-BAD2","amountPaid":0,"pricing":{"total":-5,"walletDeduction":0}}')$$);
select pg_temp.expect_fail('negative walletDeduction', $$insert into public.bookings (id, data) values ('b_bad3', '{"turfId":"t","date":"2026-10-12","hour":21,"status":"confirmed","code":"SA-BAD3","amountPaid":0,"pricing":{"total":10,"walletDeduction":-10}}')$$);

select pg_temp.expect_ok('turf with a price',   $$insert into public.turfs (id, data) values ('t_ok', '{"pricePerHour": 800}')$$);
select pg_temp.expect_fail('turf priced at 0',  $$insert into public.turfs (id, data) values ('t_bad', '{"pricePerHour": 0}')$$);

select pg_temp.expect_ok('promo',               $$insert into public.promo_codes (id, data) values ('c_ok', '{"value": 10, "uses": 0}')$$);
select pg_temp.expect_fail('negative promo uses', $$insert into public.promo_codes (id, data) values ('c_bad', '{"value": 10, "uses": -1}')$$);
rollback;

-- Existing bad rows must not stop a new migration run: a constraint added NOT VALID leaves them alone
select 'constraints present: ' || count(*) from pg_constraint
 where conname in ('players_wallet_not_negative','bookings_amounts_not_negative','turfs_price_positive','promo_codes_value_not_negative') and not convalidated;
