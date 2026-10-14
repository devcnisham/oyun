\set ON_ERROR_STOP 1
set client_min_messages = notice;

-- Fixture: one football venue with a splittable pitch, one badminton hall with 2 courts,
-- court 1 also lined for pickleball. Open 06:00–01:00 every day.
insert into oyun.sports values ('football','Football',60),('badminton','Badminton',60),('pickleball','Pickleball',30) on conflict do nothing;
insert into oyun.venues (id, slug, name, status) values
  ('00000000-0000-0000-0000-00000000000a','perfect-pass','Perfect Pass','active'),
  ('00000000-0000-0000-0000-00000000000b','smash-court','Smash Court','active');
insert into oyun.opening_hours select v, d, '06:00', '01:00'
  from unnest(array['00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000b']::uuid[]) v, generate_series(0,6) d;
insert into oyun.resources (id, venue_id, name) values
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000000a','Half A'),
  ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-00000000000a','Half B'),
  ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-00000000000b','Court 1'),
  ('00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-00000000000b','Court 2');
insert into oyun.bookables (id, venue_id, sport, name, slot_minutes, base_price) values
  ('00000000-0000-0000-0000-00000000f001','00000000-0000-0000-0000-00000000000a','football','Full pitch',60,1000),
  ('00000000-0000-0000-0000-00000000f00a','00000000-0000-0000-0000-00000000000a','football','Half pitch A',60,550),
  ('00000000-0000-0000-0000-00000000f00b','00000000-0000-0000-0000-00000000000a','football','Half pitch B',60,550),
  ('00000000-0000-0000-0000-00000000bd01','00000000-0000-0000-0000-00000000000b','badminton','Badminton court 1',60,400),
  ('00000000-0000-0000-0000-00000000bd02','00000000-0000-0000-0000-00000000000b','badminton','Badminton court 2',60,400),
  ('00000000-0000-0000-0000-00000000bc01','00000000-0000-0000-0000-00000000000b','pickleball','Pickleball on court 1',30,250);
insert into oyun.bookable_resources values
  ('00000000-0000-0000-0000-00000000f001','00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-00000000f001','00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-00000000f00a','00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-00000000f00b','00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-00000000bd01','00000000-0000-0000-0000-0000000000b1'),
  ('00000000-0000-0000-0000-00000000bd02','00000000-0000-0000-0000-0000000000b2'),
  ('00000000-0000-0000-0000-00000000bc01','00000000-0000-0000-0000-0000000000b1');
-- Peak 18:00–23:00 +30%, weekend +20%
insert into oyun.price_rules (bookable_id, name, starts, ends, kind, value, priority) values
  ('00000000-0000-0000-0000-00000000f001','Evening peak','18:00','23:00','percent',30,10);
insert into oyun.price_rules (bookable_id, name, weekdays, kind, value, priority) values
  ('00000000-0000-0000-0000-00000000f001','Weekend','{0,6}','percent',20,20);

-- Helpers
create temp table results (n serial, test text, ok boolean, info text);
create function pg_temp.t(p_test text, p_sql text, p_expect_error text default null) returns void language plpgsql as $$
declare err text;
begin
  begin
    execute p_sql;
    insert into results (test, ok, info) values (p_test, p_expect_error is null, case when p_expect_error is null then 'ok' else 'expected error ' || p_expect_error || ' but it succeeded' end);
  exception when others then
    err := sqlerrm;
    insert into results (test, ok, info) values (p_test, p_expect_error is not null and err like '%' || p_expect_error || '%', err);
  end;
end $$;
-- Tomorrow at a local time
create function pg_temp.at(hhmm text, plus_days int default 1) returns timestamptz language sql as $$
  select (((now() at time zone 'Asia/Kolkata')::date + plus_days) + hhmm::time)::timestamp at time zone 'Asia/Kolkata'
$$;
create function pg_temp.hold(holder text, bookable text, starts timestamptz[]) returns uuid language sql as $$
  select oyun.hold_slots(holder, bookable::uuid, starts)
$$;

-- 1. Full pitch at 18:00, then the same slot by someone else
select pg_temp.t('full pitch hold', $q$ select pg_temp.hold('dev1','00000000-0000-0000-0000-00000000f001', array[pg_temp.at('18:00')]) $q$);
select pg_temp.t('same full pitch blocked', $q$ select pg_temp.hold('dev2','00000000-0000-0000-0000-00000000f001', array[pg_temp.at('18:00')]) $q$, 'slot_taken');
select pg_temp.t('half A blocked by full', $q$ select pg_temp.hold('dev2','00000000-0000-0000-0000-00000000f00a', array[pg_temp.at('18:00')]) $q$, 'slot_taken');
-- 2. Halves share an hour; full can't join
select pg_temp.t('half A at 19:00', $q$ select pg_temp.hold('dev3','00000000-0000-0000-0000-00000000f00a', array[pg_temp.at('19:00')]) $q$);
select pg_temp.t('half B at 19:00 alongside A', $q$ select pg_temp.hold('dev4','00000000-0000-0000-0000-00000000f00b', array[pg_temp.at('19:00')]) $q$);
select pg_temp.t('full at 19:00 blocked by halves', $q$ select pg_temp.hold('dev5','00000000-0000-0000-0000-00000000f001', array[pg_temp.at('19:00')]) $q$, 'slot_taken');
-- 3. Shared court: badminton 18:00–19:00 on court 1 blocks pickleball 18:30 on court 1, not court 2
select pg_temp.t('badminton court 1 18:00', $q$ select pg_temp.hold('dev6','00000000-0000-0000-0000-00000000bd01', array[pg_temp.at('18:00')]) $q$);
select pg_temp.t('pickleball 18:30 same court blocked', $q$ select pg_temp.hold('dev7','00000000-0000-0000-0000-00000000bc01', array[pg_temp.at('18:30')]) $q$, 'slot_taken');
select pg_temp.t('pickleball 19:00 same court ok', $q$ select pg_temp.hold('dev7','00000000-0000-0000-0000-00000000bc01', array[pg_temp.at('19:00')]) $q$);
select pg_temp.t('badminton court 2 18:00 ok', $q$ select pg_temp.hold('dev8','00000000-0000-0000-0000-00000000bd02', array[pg_temp.at('18:00')]) $q$);
-- 4. Validation
select pg_temp.t('off-grid start rejected', $q$ select pg_temp.hold('dev9','00000000-0000-0000-0000-00000000bd02', array[pg_temp.at('10:15')]) $q$, 'not_a_slot_start');
select pg_temp.t('closed hours rejected', $q$ select pg_temp.hold('dev9','00000000-0000-0000-0000-00000000bd02', array[pg_temp.at('03:00')]) $q$, 'venue_closed');
select pg_temp.t('past-midnight slot ok (00:00)', $q$ select pg_temp.hold('dev9','00000000-0000-0000-0000-00000000bd02', array[pg_temp.at('00:00', 2)]) $q$);
select pg_temp.t('slot in the past rejected', $q$ select pg_temp.hold('dev9','00000000-0000-0000-0000-00000000bd02', array[pg_temp.at('10:00', -1)]) $q$, 'slot_in_past');
select pg_temp.t('beyond booking window rejected', $q$ select pg_temp.hold('dev9','00000000-0000-0000-0000-00000000bd02', array[pg_temp.at('10:00', 9)]) $q$, 'outside_booking_window');
-- 5. Hold expiry frees the slot; a new hold by the same device replaces the old one
update oyun.bookings set hold_expires_at = now() - interval '1 second' where holder = 'dev1';
select pg_temp.t('expired hold frees slot', $q$ select pg_temp.hold('dev2','00000000-0000-0000-0000-00000000f001', array[pg_temp.at('18:00')]) $q$);
select pg_temp.t('re-hold replaces own earlier hold', $q$ select pg_temp.hold('dev2','00000000-0000-0000-0000-00000000f001', array[pg_temp.at('21:00')]) $q$);
select pg_temp.t('18:00 free again after re-hold', $q$ select pg_temp.hold('dev10','00000000-0000-0000-0000-00000000f001', array[pg_temp.at('18:00')]) $q$);
-- 6. Confirm, cancel frees
select pg_temp.t('confirm hold', $q$ select oyun.confirm_hold((select id from oyun.bookings where holder='dev10' and status='held'), 'dev10', 'Rahul', '9876543210') $q$);
select pg_temp.t('cancel booking', $q$ select oyun.cancel_booking((select id from oyun.bookings where holder='dev10' and status='confirmed'), 'player cancelled') $q$);
select pg_temp.t('slot free after cancel', $q$ select pg_temp.hold('dev11','00000000-0000-0000-0000-00000000f001', array[pg_temp.at('18:00')]) $q$);
-- 7. Owner block vs booking
select pg_temp.t('block on held slot fails', $q$ select oyun.block_slot('00000000-0000-0000-0000-00000000f001', tstzrange(pg_temp.at('18:00'), pg_temp.at('19:00')), 'maintenance') $q$, 'slot_taken');
select pg_temp.t('block free slot', $q$ select oyun.block_slot('00000000-0000-0000-0000-00000000f00a', tstzrange(pg_temp.at('08:00'), pg_temp.at('10:00')), 'maintenance') $q$);
select pg_temp.t('booking inside block fails', $q$ select pg_temp.hold('dev12','00000000-0000-0000-0000-00000000f001', array[pg_temp.at('09:00')]) $q$, 'slot_taken');
-- 8. Online payment: pending → paid; late payment after expiry
select pg_temp.t('online hold + pending_payment', $q$
  with h as (select pg_temp.hold('dev13','00000000-0000-0000-0000-00000000bd02', array[pg_temp.at('07:00')]) id)
  select oyun.confirm_hold(id, 'dev13', 'Asha', '9123456780', true) from h $q$);
insert into oyun.payments (booking_id, provider_order_id, amount) select id, 'order_1', 400 from oyun.bookings where holder='dev13';
select pg_temp.t('webhook confirms', $q$ do $d$ begin if oyun.confirm_payment('order_1','pay_1',400) <> 'confirmed' then raise exception 'bad'; end if; end $d$ $q$);
select pg_temp.t('webhook replay is a no-op', $q$ do $d$ begin if oyun.confirm_payment('order_1','pay_1',400) <> 'already_confirmed' then raise exception 'bad'; end if; end $d$ $q$);
select pg_temp.t('online hold 2', $q$
  with h as (select pg_temp.hold('dev14','00000000-0000-0000-0000-00000000bd02', array[pg_temp.at('08:00')]) id)
  select oyun.confirm_hold(id, 'dev14', 'Vik', '9123456781', true) from h $q$);
insert into oyun.payments (booking_id, provider_order_id, amount) select id, 'order_2', 400 from oyun.bookings where holder='dev14';
update oyun.bookings set hold_expires_at = now() - interval '1 second' where holder='dev14';
select pg_temp.t('someone takes the slot after expiry', $q$ select pg_temp.hold('dev15','00000000-0000-0000-0000-00000000bd02', array[pg_temp.at('08:00')]) $q$);
select pg_temp.t('late webhook -> refund_needed', $q$ do $d$ begin if oyun.confirm_payment('order_2','pay_2',400) <> 'refund_needed' then raise exception 'bad'; end if; end $d$ $q$);
-- 9. Public RPC wrappers
select pg_temp.t('public.hold_slots', $q$ select public.hold_slots('dev_pub','00000000-0000-0000-0000-00000000f001', array[pg_temp.at('12:00')]) $q$);
select pg_temp.t('public.available_slots shows held slot', $q$ do $d$ begin
  if not exists (select 1 from public.available_slots('00000000-0000-0000-0000-00000000f001', (now() at time zone 'Asia/Kolkata')::date + 1) where state = 'held' and starts_at = pg_temp.at('12:00')) then
    raise exception 'slot not marked as held';
  end if;
end $d$ $q$);
select pg_temp.t('public.confirm_hold', $q$ select public.confirm_hold((select id from oyun.bookings where holder='dev_pub' and status='held'), 'dev_pub', 'Public User', '9876543299') $q$);
select pg_temp.t('public.cancel_booking', $q$ select public.cancel_booking((select id from oyun.bookings where holder='dev_pub' and status='confirmed'), 'public cancel') $q$);
select pg_temp.t('public.expire_holds', $q$ select public.expire_holds() $q$);

select n, case when ok then 'PASS' else 'FAIL' end as result, test, left(info, 60) as info from results order by n;

-- Prices: tomorrow 10:00 vs 19:00 on the full pitch
select to_char(starts_at at time zone 'Asia/Kolkata','HH24:MI') as slot, price, state
  from oyun.available_slots('00000000-0000-0000-0000-00000000f001', (now() at time zone 'Asia/Kolkata')::date + 1)
 where to_char(starts_at at time zone 'Asia/Kolkata','HH24:MI') in ('06:00','08:00','09:00','17:00','18:00','19:00','21:00','00:00');

-- Fail the run (non-zero exit with ON_ERROR_STOP) if any test failed, so CI catches it
do $$
declare failed int; total int;
begin
  select count(*) filter (where not ok), count(*) into failed, total from results;
  if total = 0 then raise exception 'no SQL tests ran'; end if;
  if failed > 0 then raise exception '% of % SQL tests failed', failed, total; end if;
  raise notice 'all % SQL tests passed', total;
end $$;
