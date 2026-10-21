\set ON_ERROR_STOP 1
-- The collections that used to be dropped are now saved, delta-synced and reset
do $$
declare
  rev0 bigint; rev1 bigint; state jsonb; delta jsonb;
begin
  select rev into rev0 from public.app_meta where id = 1;
  if rev0 is null then rev0 := public.apply_changes('{}'::jsonb, null); end if;
  rev1 := public.apply_changes('{"upserts":{
      "payouts":[{"id":"po_t1","data":{"id":"po_t1","net":100}}],
      "waitlist":[{"id":"wl_t1","data":{"id":"wl_t1"}}],
      "open_matches":[{"id":"match_t1","data":{"id":"match_t1"}}],
      "tournaments":[{"id":"tour_t1","data":{"id":"tour_t1"}}],
      "activity":[{"id":"act_t1","data":{"id":"act_t1"}}]}}'::jsonb, rev0);
  state := public.load_state();
  if jsonb_array_length(state->'payouts') <> 1 or jsonb_array_length(state->'activity') <> 1
     or jsonb_array_length(state->'open_matches') <> 1 or jsonb_array_length(state->'tournaments') <> 1
     or jsonb_array_length(state->'waitlist') <> 1 then
    raise exception 'FAIL: collections not returned by load_state: %', state;
  end if;
  delta := public.load_changes(rev0);
  if jsonb_array_length(delta->'upserts'->'payouts') <> 1 then raise exception 'FAIL: delta missed payouts: %', delta; end if;
  -- a second writer touching a different collection does not conflict; the same row does
  perform public.apply_changes('{"upserts":{"waitlist":[{"id":"wl_t2","data":{"id":"wl_t2"}}]}}'::jsonb, rev0);
  begin
    perform public.apply_changes('{"upserts":{"payouts":[{"id":"po_t1","data":{"id":"po_t1","net":5}}]}}'::jsonb, rev0);
    raise exception 'FAIL: stale write to the same row accepted';
  exception when sqlstate '40001' then null; end;
  perform public.apply_changes('{"deletes":{"payouts":["po_t1"]}}'::jsonb, (select rev from public.app_meta where id = 1));
  if jsonb_array_length(public.load_state()->'payouts') <> 0 then raise exception 'FAIL: delete not applied'; end if;
  perform public.reset_state();
  if (select count(*) from public.activity) <> 0 then raise exception 'FAIL: reset_state left rows'; end if;
  raise notice 'persist_collections tests passed';
end $$;
