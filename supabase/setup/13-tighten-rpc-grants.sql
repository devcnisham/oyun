-- OYUN database setup: tighten who may call the public RPC wrappers. Run after step 12 (or after 10). Safe to run again.

do $$
declare f text;
begin
  foreach f in array array[
    'public.available_slots(uuid, date)',
    'public.hold_slots(text, uuid, timestamptz[], uuid, interval)',
    'public.confirm_hold(uuid, text, text, text, boolean, interval)',
    'public.confirm_payment(text, text, int)',
    'public.cancel_booking(uuid, text)',
    'public.block_slot(uuid, tstzrange, text, uuid)',
    'public.expire_holds()',
    'public.sync_turf_to_venue(jsonb)',
    'public.sync_all_turfs_to_venues()',
    'oyun.sync_turf_to_venue(jsonb)'
  ] loop
    if to_regprocedure(f) is not null then
      execute format('revoke execute on function %s from public, anon, authenticated', f);
      execute format('grant execute on function %s to service_role', f);
      -- A definer function must not resolve names through the caller's search_path
      if f like 'public.%' then
        execute format('alter function %s set search_path = oyun, public', f);
      end if;
    end if;
  end loop;
end $$;
