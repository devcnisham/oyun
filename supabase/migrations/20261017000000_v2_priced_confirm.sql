-- v2 integration, phase 1 (docs/V2-INTEGRATION-PLAN.md): let a v2 booking carry what the app shows.
-- confirm_hold only took name and phone, so price, promo, wallet use and add-ons never reached oyun.bookings.
--   * meta jsonb: add-ons, payment mode and other app fields that have no column yet
--   * legacy_id: the app's own text id, so players and bookings map both ways (the uuid itself is derived
--     from it deterministically in src/lib/v2-ids.ts)
--   * confirm_hold_priced(): confirm a hold and store the priced quote in one step
-- Safe to run again. Run after 20261011000000_slot_booking_v2.sql.

alter table oyun.bookings add column if not exists meta jsonb not null default '{}';
alter table oyun.bookings add column if not exists legacy_id text;
create unique index if not exists bookings_legacy_id_uniq on oyun.bookings (legacy_id) where legacy_id is not null;
alter table oyun.players add column if not exists legacy_id text;
create unique index if not exists players_legacy_id_uniq on oyun.players (legacy_id) where legacy_id is not null;

-- total is what is left to pay after the wallet, so wallet_used may exceed it (a booking paid fully from the wallet has total 0).
-- p_quote: { subtotal, discount, walletUsed, total, advanceDue, amountPaid, priceBreakdown, meta, legacyId, source }
create or replace function oyun.confirm_hold_priced(
  p_booking uuid, p_holder text, p_name text, p_phone text, p_quote jsonb,
  p_player uuid default null, p_pay_online boolean default false,
  p_payment_window interval default interval '15 minutes')
returns oyun.bookings language plpgsql as $$
declare
  bk oyun.bookings;
  v_subtotal int := coalesce((p_quote->>'subtotal')::int, 0);
  v_discount int := coalesce((p_quote->>'discount')::int, 0);
  v_wallet int := coalesce((p_quote->>'walletUsed')::int, 0);
  v_total int := coalesce((p_quote->>'total')::int, 0);
  v_advance int := coalesce((p_quote->>'advanceDue')::int, 0);
  v_paid int := coalesce((p_quote->>'amountPaid')::int, 0);
begin
  if p_quote is null or jsonb_typeof(p_quote) <> 'object'
     or least(v_subtotal, v_discount, v_wallet, v_total, v_advance, v_paid) < 0
     or v_paid > v_total then
    raise exception 'invalid_quote' using errcode = 'P0001';
  end if;
  select * into bk from oyun.bookings where id = p_booking for update;
  if not found or bk.holder is distinct from p_holder then
    raise exception 'booking_not_found' using errcode = 'P0002';
  end if;
  if bk.status <> 'held' or bk.hold_expires_at < now() then
    raise exception 'hold_expired' using errcode = 'P0001';
  end if;
  update oyun.bookings
     set customer_name = p_name, customer_phone = p_phone,
         player_id = coalesce(p_player, player_id),
         subtotal = v_subtotal, discount = v_discount, wallet_used = v_wallet, total = v_total,
         advance_due = v_advance, amount_paid = v_paid,
         price_breakdown = coalesce(p_quote->'priceBreakdown', '{}'::jsonb),
         meta = coalesce(p_quote->'meta', '{}'::jsonb),
         legacy_id = coalesce(p_quote->>'legacyId', legacy_id),
         source = coalesce(p_quote->>'source', source),
         status = case when p_pay_online then 'pending_payment' else 'confirmed' end::oyun.booking_status,
         hold_expires_at = case when p_pay_online then now() + p_payment_window else null end
   where id = p_booking
  returning * into bk;
  return bk;
end $$;

create or replace function public.confirm_hold_priced(
  p_booking uuid, p_holder text, p_name text, p_phone text, p_quote jsonb,
  p_player uuid default null, p_pay_online boolean default false,
  p_payment_window interval default interval '15 minutes')
returns oyun.bookings language plpgsql security definer set search_path = oyun, public as $$
begin
  return oyun.confirm_hold_priced(p_booking, p_holder, p_name, p_phone, p_quote, p_player, p_pay_online, p_payment_window);
end $$;

alter function oyun.confirm_hold_priced(uuid, text, text, text, jsonb, uuid, boolean, interval) set search_path = oyun, public;
revoke execute on function public.confirm_hold_priced(uuid, text, text, text, jsonb, uuid, boolean, interval) from public, anon, authenticated;
grant execute on function public.confirm_hold_priced(uuid, text, text, text, jsonb, uuid, boolean, interval) to service_role;
