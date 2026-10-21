-- A webhook event is claimed before the booking is confirmed (claim_payment_event, step 15). If the confirm
-- then fails (database error), the claim must be given back, or Razorpay's retry is answered "already
-- processed" and the paid booking is never confirmed. release_payment_event() deletes the claim.
-- Needs the processed_payment_events table from supabase/setup/15-payment-events.sql; creates it if missing.
-- Safe to run again.

create table if not exists public.processed_payment_events (
  event_key   text primary key,
  order_id    text not null,
  payment_id  text not null,
  received_at timestamptz not null default now()
);
alter table public.processed_payment_events enable row level security;

create or replace function public.claim_payment_event(p_event_key text, p_order_id text, p_payment_id text)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  insert into public.processed_payment_events (event_key, order_id, payment_id)
  values (p_event_key, p_order_id, p_payment_id);
  return true;
exception
  when unique_violation then
    return false;
end $$;

create or replace function public.release_payment_event(p_event_key text)
returns void
language sql
set search_path = public
as $$
  delete from public.processed_payment_events where event_key = p_event_key
$$;

revoke all on function public.claim_payment_event(text, text, text) from public, anon, authenticated;
revoke all on function public.release_payment_event(text) from public, anon, authenticated;
grant execute on function public.claim_payment_event(text, text, text) to service_role;
grant execute on function public.release_payment_event(text) to service_role;
