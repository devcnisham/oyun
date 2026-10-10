-- OYUN database setup, step 8: shared rate limits (task P9-06). Run after step 7 in Supabase → SQL Editor.
-- Paste the WHOLE file, make sure no text is highlighted, then click Run. Safe to run again.

-- Shared rate limits (task P9-06). The in-memory limiter counts per server instance, so on serverless it only
-- slows abuse down. These counters live in Postgres, so every instance sees the same numbers.
--
-- rl_hit(key, window_ms, sliding)  add one hit, return the count inside the window.
--                                  fixed window (default): the window starts at the first hit.
--                                  sliding: the window restarts at every hit (a lock that lasts after the last try).
-- rl_get(key, window_ms, sliding)  the live count without adding a hit.
-- rl_clear(key)                    forget a key (a correct password clears its failures).
-- Server only: the secret key maps to service_role. Safe to run again.

create table if not exists public.rate_limits (
  key          text primary key,
  count        integer not null,
  window_start timestamptz not null,
  last_hit     timestamptz not null
);
alter table public.rate_limits enable row level security;

create or replace function public.rl_hit(p_key text, p_window_ms integer, p_sliding boolean default false)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_count integer;
  v_window interval := make_interval(secs => p_window_ms / 1000.0);
  v_now timestamptz := clock_timestamp();
begin
  insert into public.rate_limits as r (key, count, window_start, last_hit)
  values (p_key, 1, v_now, v_now)
  on conflict (key) do update set
    count = case when (case when p_sliding then r.last_hit else r.window_start end) < v_now - v_window then 1 else r.count + 1 end,
    window_start = case when (case when p_sliding then r.last_hit else r.window_start end) < v_now - v_window then v_now else r.window_start end,
    last_hit = v_now
  returning r.count into v_count;

  -- Housekeeping: now and then drop keys nobody has touched for a day
  if random() < 0.01 then
    delete from public.rate_limits where last_hit < v_now - interval '1 day';
  end if;
  return v_count;
end $$;

create or replace function public.rl_get(p_key text, p_window_ms integer, p_sliding boolean default false)
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce(
    (select r.count from public.rate_limits r
      where r.key = p_key
        and (case when p_sliding then r.last_hit else r.window_start end) >= clock_timestamp() - make_interval(secs => p_window_ms / 1000.0)),
    0);
$$;

create or replace function public.rl_clear(p_key text)
returns void
language sql
set search_path = public
as $$
  delete from public.rate_limits where key = p_key;
$$;

revoke all on function public.rl_hit(text, integer, boolean) from public, anon, authenticated;
revoke all on function public.rl_get(text, integer, boolean) from public, anon, authenticated;
revoke all on function public.rl_clear(text) from public, anon, authenticated;
grant execute on function public.rl_hit(text, integer, boolean) to service_role;
grant execute on function public.rl_get(text, integer, boolean) to service_role;
grant execute on function public.rl_clear(text) to service_role;
