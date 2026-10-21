\set ON_ERROR_STOP 1
do $$
begin
  if not public.claim_payment_event('o1:p1', 'o1', 'p1') then raise exception 'FAIL: first claim refused'; end if;
  if public.claim_payment_event('o1:p1', 'o1', 'p1') then raise exception 'FAIL: replay accepted'; end if;
  perform public.release_payment_event('o1:p1');
  if not public.claim_payment_event('o1:p1', 'o1', 'p1') then raise exception 'FAIL: claim after release refused'; end if;
  perform public.release_payment_event('missing');
  raise notice 'payment event tests passed';
end $$;
