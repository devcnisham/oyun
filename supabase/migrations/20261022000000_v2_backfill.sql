-- v2 integration, phase 5 (docs/V2-INTEGRATION-PLAN.md): copy existing bookings into oyun and check the copy.
--   oyun.backfill_legacy_bookings(dry_run): for every row of public.bookings not yet in oyun, create the oyun
--     booking, its slot items and (for live bookings) its slot claims. Safe to run again: rows already copied
--     (legacy_id) are skipped. A dry run does all of it and rolls it back, so the report is exact.
--   oyun.parity_report(): compares what is in public.bookings with what is in oyun.
-- Players are copied too (oyun.players.legacy_id). Run the dry run first and read the report.
-- Run after 20261019000000. Safe to run again.

create or replace function oyun.backfill_legacy_bookings(p_dry_run boolean default true)
returns jsonb language plpgsql as $$
declare
  rep jsonb := jsonb_build_object('dryRun', p_dry_run, 'players', 0, 'inserted', 0, 'alreadyThere', 0,
                                  'noVenue', '[]'::jsonb, 'noBookable', '[]'::jsonb, 'noSlots', '[]'::jsonb,
                                  'claimConflicts', '[]'::jsonb, 'errors', '[]'::jsonb);
  lb record;
  d jsonb;
  v oyun.venues;
  b oyun.bookables;
  bk uuid;
  pl uuid;
  it jsonb;
  items jsonb;
  hrs int[];
  h int;
  st text;
  starts timestamptz;
  during tstzrange;
  open_hour int;
  item_id uuid;
  n_items int;
  live boolean;
  conflict boolean;
  n int;
  dur int;
  minute int;
  day date;
  pitch text;
  amount_total int;
begin
  if to_regclass('public.bookings') is null then
    raise exception 'public.bookings does not exist: nothing to copy' using errcode = 'P0001';
  end if;

  begin
    -- players first, so bookings can point at them
    if to_regclass('public.players') is not null then
      insert into oyun.players (legacy_id, name, phone, status, clerk_user_id, created_at)
      select p.id, left(coalesce(p.data->>'name', 'Player'), 80), p.data->>'phone',
             case when p.data->>'status' = 'banned' then 'banned' else 'active' end,
             nullif(p.data->>'accountId', ''),
             coalesce((p.data->>'createdAt')::timestamptz, now())
        from public.players p
       where p.data->>'phone' ~ '^[6-9][0-9]{9}$'
         and not exists (select 1 from oyun.players o where o.legacy_id = p.id or o.phone = p.data->>'phone')
      on conflict do nothing;
      get diagnostics n = row_count;
      rep := jsonb_set(rep, '{players}', to_jsonb(n));
    end if;

    for lb in select id, data from public.bookings order by seq loop
      d := lb.data;
      begin
        if exists (select 1 from oyun.bookings where legacy_id = lb.id) then
          rep := jsonb_set(rep, '{alreadyThere}', to_jsonb((rep->>'alreadyThere')::int + 1));
          continue;
        end if;
        select * into v from oyun.venues where slug = d->>'turfId';
        if not found then
          rep := jsonb_set(rep, '{noVenue}', (rep->'noVenue') || to_jsonb(lb.id));
          continue;
        end if;
        pitch := d->>'pitch';
        select * into b from oyun.bookables x
         where x.venue_id = v.id and x.active
           and case when pitch = 'A' then x.name like 'Half Pitch A%'
                    when pitch = 'B' then x.name like 'Half Pitch B%'
                    else x.sort = 0 end
         order by x.sort limit 1;
        if not found then
          rep := jsonb_set(rep, '{noBookable}', (rep->'noBookable') || to_jsonb(lb.id));
          continue;
        end if;

        -- the slots: the order's items when it has them, else its hours
        items := coalesce(d->'items', '[]'::jsonb);
        if jsonb_array_length(items) = 0 then
          items := coalesce((
            select jsonb_agg(jsonb_build_object('hour', x, 'durationMinutes',
                     case when jsonb_array_length(coalesce(d->'hours', '[]'::jsonb)) > 1 then 60 else coalesce((d->>'durationMinutes')::int, 60) end,
                     'startMinute', coalesce((d->>'startMinute')::int, 0), 'price',
                     coalesce((d->'pricing'->>'slotPrice')::int, 0)))
              from jsonb_array_elements_text(coalesce(d->'hours', jsonb_build_array(d->'hour'))) x), '[]'::jsonb);
        end if;
        if jsonb_array_length(items) = 0 then
          rep := jsonb_set(rep, '{noSlots}', (rep->'noSlots') || to_jsonb(lb.id));
          continue;
        end if;

        st := d->>'status';
        live := st in ('confirmed', 'checked_in');
        select id into pl from oyun.players where legacy_id = d->>'playerId';
        amount_total := coalesce((d->'pricing'->>'total')::int, 0);

        insert into oyun.bookings (legacy_id, code, venue_id, player_id, customer_name, customer_phone, source, status,
            subtotal, discount, wallet_used, total, advance_due, amount_paid, price_breakdown, meta,
            cancelled_at, cancel_reason, checked_in_at, created_at)
        values (lb.id, coalesce(nullif(d->>'code', ''), upper(substr(md5(lb.id), 1, 8))), v.id, pl,
            d->>'customerName', d->>'customerPhone',
            case when d->>'source' = 'walk_in' then 'walk_in' else 'online' end,
            (case st when 'refunded' then 'cancelled' when 'confirmed' then 'confirmed' when 'checked_in' then 'checked_in'
                     when 'no_show' then 'no_show' else 'cancelled' end)::oyun.booking_status,
            coalesce((d->'pricing'->>'subtotal')::int, 0), 0, coalesce((d->'pricing'->>'walletDeduction')::int, 0),
            amount_total, coalesce((d->'pricing'->>'advance')::int, 0),
            least(greatest(coalesce((d->>'amountPaid')::int, 0), 0), amount_total),
            coalesce(d->'pricing', '{}'::jsonb),
            jsonb_strip_nulls(jsonb_build_object(
              'addOns', d->'addOns', 'paymentMode', d->>'paymentMode', 'cashback', d->'cashback',
              'cashCollected', d->'cashCollected', 'accountId', d->>'accountId', 'review', d->'review',
              'rescheduledAt', d->>'rescheduledAt', 'originalSlot', d->'originalSlot',
              'recurringGroupId', d->>'recurringGroupId', 'recurringWeek', d->'recurringWeek',
              'createdBy', d->>'createdBy', 'refunded', (st = 'refunded'), 'backfilled', true)),
            (d->>'cancelledAt')::timestamptz, d->>'cancelReason', (d->>'checkedInAt')::timestamptz,
            coalesce((d->>'createdAt')::timestamptz, now()))
        returning id into bk;

        n_items := 0;
        conflict := false;
        for it in select * from jsonb_array_elements(items) loop
          h := (it->>'hour')::int;
          minute := coalesce((it->>'startMinute')::int, 0);
          dur := coalesce((it->>'durationMinutes')::int, 60);
          day := (d->>'date')::date;
          -- hours 24 and up, or before the venue opens, belong to the next calendar day
          select extract(hour from opens)::int into open_hour from oyun.opening_hours
           where venue_id = v.id and weekday = extract(dow from day)::smallint order by opens limit 1;
          if h >= 24 then day := day + 1; h := h - 24;
          elsif coalesce(open_hour, 0) > 0 and h < open_hour then day := day + 1;
          end if;
          starts := ((day + make_interval(hours => h, mins => minute))::timestamp at time zone v.timezone);
          during := tstzrange(starts, starts + make_interval(mins => dur));
          insert into oyun.booking_items (booking_id, bookable_id, during, price)
          values (bk, b.id, during, greatest(coalesce((it->>'price')::int, 0), 0)) returning id into item_id;
          n_items := n_items + 1;
          begin
            insert into oyun.slot_claims (resource_id, during, booking_item_id, released_at)
            select br.resource_id, during, item_id, case when live then null else now() end
              from oyun.bookable_resources br where br.bookable_id = b.id;
          exception when exclusion_violation then
            conflict := true;
            insert into oyun.slot_claims (resource_id, during, booking_item_id, released_at)
            select br.resource_id, during, item_id, now() from oyun.bookable_resources br where br.bookable_id = b.id;
          end;
        end loop;
        if conflict then
          rep := jsonb_set(rep, '{claimConflicts}', (rep->'claimConflicts') || to_jsonb(lb.id));
        end if;
        rep := jsonb_set(rep, '{inserted}', to_jsonb((rep->>'inserted')::int + 1));
      exception when others then
        rep := jsonb_set(rep, '{errors}', (rep->'errors') || jsonb_build_object('id', lb.id, 'error', sqlerrm));
      end;
    end loop;

    if p_dry_run then
      raise exception 'backfill_dry_run' using errcode = 'P0001';
    end if;
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'backfill_dry_run' then raise; end if;
  end;
  return rep;
end $$;

-- What public.bookings holds against what oyun holds, by status and in money. ok is true when nothing differs.
create or replace function oyun.parity_report()
returns jsonb language plpgsql stable as $$
declare
  legacy jsonb;
  copied jsonb;
  missing jsonb;
  ok boolean;
begin
  if to_regclass('public.bookings') is null then
    return jsonb_build_object('ok', false, 'error', 'public.bookings does not exist');
  end if;
  select coalesce(jsonb_object_agg(s, jsonb_build_object('count', c, 'total', t, 'paid', p)), '{}'::jsonb) into legacy
    from (select case data->>'status' when 'refunded' then 'cancelled' else data->>'status' end s, count(*) c,
                 coalesce(sum((data->'pricing'->>'total')::int), 0) t, coalesce(sum((data->>'amountPaid')::int), 0) p
            from public.bookings group by 1) x;
  select coalesce(jsonb_object_agg(s, jsonb_build_object('count', c, 'total', t, 'paid', p)), '{}'::jsonb) into copied
    from (select status::text s, count(*) c, coalesce(sum(total), 0) t, coalesce(sum(amount_paid), 0) p
            from oyun.bookings where legacy_id is not null group by 1) x;
  select coalesce(jsonb_agg(b.id), '[]'::jsonb) into missing
    from (select id from public.bookings b where not exists (select 1 from oyun.bookings o where o.legacy_id = b.id) limit 50) b;
  ok := legacy = copied and missing = '[]'::jsonb;
  return jsonb_build_object('ok', ok, 'legacy', legacy, 'oyun', copied, 'missingFromOyun', missing,
    'bookingsWithoutSlots', (select count(*) from oyun.bookings o where o.legacy_id is not null
                              and not exists (select 1 from oyun.booking_items i where i.booking_id = o.id)));
end $$;

create or replace function public.backfill_legacy_bookings(p_dry_run boolean default true)
returns jsonb language plpgsql security definer set search_path = oyun, public as $$
begin
  return oyun.backfill_legacy_bookings(p_dry_run);
end $$;

create or replace function public.parity_report()
returns jsonb language plpgsql security definer set search_path = oyun, public as $$
begin
  return oyun.parity_report();
end $$;

alter function oyun.backfill_legacy_bookings(boolean) set search_path = oyun, public;
alter function oyun.parity_report() set search_path = oyun, public;
revoke execute on function public.backfill_legacy_bookings(boolean) from public, anon, authenticated;
revoke execute on function public.parity_report() from public, anon, authenticated;
grant execute on function public.backfill_legacy_bookings(boolean) to service_role;
grant execute on function public.parity_report() to service_role;
