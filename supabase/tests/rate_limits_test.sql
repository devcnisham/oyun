-- Shared rate limits (P9-06): counting, window expiry, sliding windows, clearing and who may call them.
\set ON_ERROR_STOP on

do $$
declare n integer;
begin
  -- fixed window: counts up inside the window
  perform public.rl_clear('t:fixed');
  n := public.rl_hit('t:fixed', 60000);  assert n = 1, 'first hit is 1, got ' || n;
  n := public.rl_hit('t:fixed', 60000);  assert n = 2, 'second hit is 2, got ' || n;
  assert public.rl_get('t:fixed', 60000) = 2, 'rl_get reads without adding';
  assert public.rl_get('t:fixed', 60000) = 2, 'rl_get did not change the count';
  assert public.rl_get('t:never', 60000) = 0, 'unknown key is 0';

  -- keys are independent
  n := public.rl_hit('t:other', 60000);  assert n = 1, 'other key starts at 1';

  -- fixed window expires from the FIRST hit, even when hits keep coming
  perform public.rl_clear('t:expire');
  perform public.rl_hit('t:expire', 200);
  perform pg_sleep(0.12);
  n := public.rl_hit('t:expire', 200);   assert n = 2, 'still inside the window, got ' || n;
  perform pg_sleep(0.12);                -- 0.24 s after the first hit
  n := public.rl_hit('t:expire', 200);   assert n = 1, 'window ended, count restarts, got ' || n;

  -- sliding window restarts at every hit
  perform public.rl_clear('t:slide');
  perform public.rl_hit('t:slide', 200, true);
  perform pg_sleep(0.12);
  n := public.rl_hit('t:slide', 200, true);  assert n = 2, 'sliding: still live, got ' || n;
  perform pg_sleep(0.12);                    -- 0.24 s after the first, 0.12 s after the last
  n := public.rl_hit('t:slide', 200, true);  assert n = 3, 'sliding: kept alive by the last hit, got ' || n;
  perform pg_sleep(0.3);
  assert public.rl_get('t:slide', 200, true) = 0, 'sliding: quiet window passed, count is 0';

  -- clear forgets a key
  perform public.rl_clear('t:fixed');
  assert public.rl_get('t:fixed', 60000) = 0, 'cleared key is 0';

  -- concurrent-safe counting is one atomic upsert; 50 hits in a row give exactly 50
  perform public.rl_clear('t:many');
  for i in 1..50 loop n := public.rl_hit('t:many', 60000); end loop;
  assert n = 50, 'fifty hits count to fifty, got ' || n;
end $$;

-- Only the server (service_role) may call these; players and anon may not
do $$
begin
  assert has_function_privilege('service_role', 'public.rl_hit(text, integer, boolean)', 'execute'), 'service_role can hit';
  assert not has_function_privilege('anon', 'public.rl_hit(text, integer, boolean)', 'execute'), 'anon cannot hit';
  assert not has_function_privilege('authenticated', 'public.rl_get(text, integer, boolean)', 'execute'), 'authenticated cannot read';
  assert not has_function_privilege('authenticated', 'public.rl_clear(text)', 'execute'), 'authenticated cannot clear';
end $$;

delete from public.rate_limits where key like 't:%';
select 'rate limit tests passed' as result;
