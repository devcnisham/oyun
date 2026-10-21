-- v2 integration, phase 3 (docs/V2-INTEGRATION-PLAN.md): write app-side booking edits back to oyun.bookings.
-- Check-in, no-show, mark paid, cash collected, cashback, review, cancel and refund all change fields of an
-- existing booking. apply_booking_updates() applies one batch atomically, matching each row by the app's
-- legacy id or by uuid. Cancelling frees the slots through the existing release_claims_on_status trigger.
-- It never creates bookings and never touches slots: holds, confirmation and reschedules have their own functions.
-- Each update: { id, status?, amountPaid?, checkedInAt?, cancelledAt?, cancelReason?, customerName?, customerPhone?, meta? }
-- meta is merged into the stored meta. Returns how many bookings changed. Safe to run again.

create or replace function oyun.apply_booking_updates(p_updates jsonb)
returns int language plpgsql as $$
declare
  u jsonb;
  bk oyun.bookings;
  n int := 0;
  st text;
begin
  if p_updates is null or jsonb_typeof(p_updates) <> 'array' then
    raise exception 'invalid_updates' using errcode = 'P0001';
  end if;
  for u in select * from jsonb_array_elements(p_updates) loop
    select * into bk from oyun.bookings
     where legacy_id = u->>'id' or id::text = u->>'id'
     for update;
    if not found then
      raise exception 'booking_not_found: %', u->>'id' using errcode = 'P0002';
    end if;
    if bk.status in ('held', 'pending_payment', 'expired') then
      raise exception 'booking_not_confirmed: %', u->>'id' using errcode = 'P0001';
    end if;
    st := u->>'status';
    if st is not null and st not in ('confirmed', 'checked_in', 'completed', 'no_show', 'cancelled') then
      raise exception 'invalid_status: %', st using errcode = 'P0001';
    end if;
    if (u->>'amountPaid') is not null and (u->>'amountPaid')::int < 0 then
      raise exception 'invalid_amount' using errcode = 'P0001';
    end if;
    update oyun.bookings set
      status = coalesce(st, status::text)::oyun.booking_status,
      amount_paid = coalesce((u->>'amountPaid')::int, amount_paid),
      checked_in_at = case when u ? 'checkedInAt' then (u->>'checkedInAt')::timestamptz else checked_in_at end,
      cancelled_at = case when u ? 'cancelledAt' then (u->>'cancelledAt')::timestamptz else cancelled_at end,
      cancel_reason = case when u ? 'cancelReason' then u->>'cancelReason' else cancel_reason end,
      customer_name = coalesce(u->>'customerName', customer_name),
      customer_phone = coalesce(u->>'customerPhone', customer_phone),
      meta = meta || coalesce(u->'meta', '{}'::jsonb)
    where id = bk.id;
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.apply_booking_updates(p_updates jsonb)
returns int language plpgsql security definer set search_path = oyun, public as $$
begin
  return oyun.apply_booking_updates(p_updates);
end $$;

alter function oyun.apply_booking_updates(jsonb) set search_path = oyun, public;
revoke execute on function public.apply_booking_updates(jsonb) from public, anon, authenticated;
grant execute on function public.apply_booking_updates(jsonb) to service_role;
