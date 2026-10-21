-- v2 integration, closing the refused list (docs/V2-INTEGRATION-PLAN.md):
--   book_ranges(): create a confirmed, priced booking for arbitrary time ranges (walk-ins with any start and
--                  length, recurring weekly bookings). hold_slots only takes starts on the venue's slot grid.
--   move_booking(): reschedule a confirmed booking to a new start, keeping each slot's length. The old claims
--                   are freed and the new ones taken in one transaction, so a taken slot leaves the booking where it was.
-- Both use the same claims and exclusion constraint as hold_slots, so double bookings stay impossible.
-- Safe to run again. Run after 20261017000000_v2_priced_confirm.sql.

create or replace function oyun.book_ranges(
  p_bookable uuid, p_ranges tstzrange[], p_name text, p_phone text, p_quote jsonb,
  p_player uuid default null, p_allow_past boolean default false)
returns oyun.bookings language plpgsql as $$
declare
  b oyun.bookables;
  v oyun.venues;
  bk uuid;
  holder text := 'direct:' || gen_random_uuid()::text;
  r tstzrange;
  item uuid;
  result oyun.bookings;
begin
  select * into b from oyun.bookables where id = p_bookable and active;
  if not found then raise exception 'bookable_not_found' using errcode = 'P0002'; end if;
  select * into v from oyun.venues where id = b.venue_id;
  if v.status <> 'active' then raise exception 'venue_not_bookable' using errcode = 'P0001'; end if;
  if coalesce(array_length(p_ranges, 1), 0) = 0 then
    raise exception 'pick at least one slot' using errcode = 'P0001';
  end if;

  perform oyun.lock_resources(array(select resource_id from oyun.bookable_resources where bookable_id = b.id));
  perform oyun.expire_holds();

  insert into oyun.bookings (venue_id, player_id, holder, status, hold_expires_at)
  values (v.id, p_player, holder, 'held', now() + interval '1 minute')
  returning id into bk;

  foreach r in array p_ranges loop
    if lower(r) is null or upper(r) is null or lower(r) >= upper(r) then
      raise exception 'invalid_range' using errcode = 'P0001';
    end if;
    if not p_allow_past and lower(r) < now() then raise exception 'slot_in_past' using errcode = 'P0001'; end if;
    if oyun.open_interval(v.id, lower(r), upper(r)) is null then raise exception 'venue_closed' using errcode = 'P0001'; end if;

    insert into oyun.booking_items (booking_id, bookable_id, during, price)
    values (bk, b.id, r, round(oyun.slot_price(b.id, lower(r)) * extract(epoch from (upper(r) - lower(r))) / (b.slot_minutes * 60.0))::int)
    returning id into item;
    begin
      insert into oyun.slot_claims (resource_id, during, booking_item_id)
      select br.resource_id, r, item from oyun.bookable_resources br where br.bookable_id = b.id;
    exception when exclusion_violation then
      raise exception 'slot_taken' using errcode = 'P0001',
        detail = to_char(lower(r) at time zone v.timezone, 'DD Mon HH24:MI');
    end;
  end loop;

  result := oyun.confirm_hold_priced(bk, holder, p_name, p_phone, p_quote, p_player);
  return result;
end $$;

-- p_booking: the app's legacy id or the uuid. p_start: where the first slot now begins.
create or replace function oyun.move_booking(p_booking text, p_start timestamptz)
returns oyun.bookings language plpgsql as $$
declare
  bk oyun.bookings;
  v oyun.venues;
  delta interval;
  it record;
  new_range tstzrange;
  item uuid;
  b oyun.bookables;
begin
  select * into bk from oyun.bookings where legacy_id = p_booking or id::text = p_booking for update;
  if not found then raise exception 'booking_not_found' using errcode = 'P0002'; end if;
  if bk.status <> 'confirmed' then raise exception 'not_movable' using errcode = 'P0001'; end if;
  if p_start < now() then raise exception 'slot_in_past' using errcode = 'P0001'; end if;
  select * into v from oyun.venues where id = bk.venue_id;
  if p_start > now() + make_interval(days => v.booking_window_days) then
    raise exception 'outside_booking_window' using errcode = 'P0001';
  end if;

  select p_start - min(lower(during)) into delta from oyun.booking_items where booking_id = bk.id;
  if delta is null then raise exception 'booking_has_no_slots' using errcode = 'P0001'; end if;

  perform oyun.lock_resources(array(
    select br.resource_id from oyun.booking_items i join oyun.bookable_resources br on br.bookable_id = i.bookable_id
     where i.booking_id = bk.id));

  create temp table if not exists pg_temp.moving (bookable_id uuid, during tstzrange, price int) on commit drop;
  truncate pg_temp.moving;
  insert into pg_temp.moving select bookable_id, during, price from oyun.booking_items where booking_id = bk.id;
  delete from oyun.booking_items where booking_id = bk.id;   -- claims go with the items

  for it in select * from pg_temp.moving order by lower(during) loop
    new_range := tstzrange(lower(it.during) + delta, upper(it.during) + delta);
    if oyun.open_interval(v.id, lower(new_range), upper(new_range)) is null then
      raise exception 'venue_closed' using errcode = 'P0001';
    end if;
    select * into b from oyun.bookables where id = it.bookable_id;
    insert into oyun.booking_items (booking_id, bookable_id, during, price)
    values (bk.id, it.bookable_id, new_range, it.price) returning id into item;
    begin
      insert into oyun.slot_claims (resource_id, during, booking_item_id)
      select br.resource_id, new_range, item from oyun.bookable_resources br where br.bookable_id = it.bookable_id;
    exception when exclusion_violation then
      raise exception 'slot_taken' using errcode = 'P0001';
    end;
  end loop;

  update oyun.bookings set updated_at = now() where id = bk.id returning * into bk;
  return bk;
end $$;

create or replace function public.book_ranges(
  p_bookable uuid, p_ranges tstzrange[], p_name text, p_phone text, p_quote jsonb,
  p_player uuid default null, p_allow_past boolean default false)
returns oyun.bookings language plpgsql security definer set search_path = oyun, public as $$
begin
  return oyun.book_ranges(p_bookable, p_ranges, p_name, p_phone, p_quote, p_player, p_allow_past);
end $$;

create or replace function public.move_booking(p_booking text, p_start timestamptz)
returns oyun.bookings language plpgsql security definer set search_path = oyun, public as $$
begin
  return oyun.move_booking(p_booking, p_start);
end $$;

alter function oyun.book_ranges(uuid, tstzrange[], text, text, jsonb, uuid, boolean) set search_path = oyun, public;
alter function oyun.move_booking(text, timestamptz) set search_path = oyun, public;
revoke execute on function public.book_ranges(uuid, tstzrange[], text, text, jsonb, uuid, boolean) from public, anon, authenticated;
revoke execute on function public.move_booking(text, timestamptz) from public, anon, authenticated;
grant execute on function public.book_ranges(uuid, tstzrange[], text, text, jsonb, uuid, boolean) to service_role;
grant execute on function public.move_booking(text, timestamptz) to service_role;
