-- OYUN database setup, step 15: durable Razorpay webhook replay protection (task P11-02).
-- Run after step 8 (rate limits) in Supabase → SQL Editor. Paste the WHOLE file, make sure no text is
-- highlighted, then click Run. Safe to run again.
--
-- claim_payment_event(event_key, order_id, payment_id) inserts the event once and returns true.
-- A repeat delivery of the same key returns false. Server only: the secret key maps to service_role.

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

revoke all on function public.claim_payment_event(text, text, text) from public, anon, authenticated;
grant execute on function public.claim_payment_event(text, text, text) to service_role;
