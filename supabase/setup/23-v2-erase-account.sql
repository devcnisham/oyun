-- Privacy erase (DPDP) for bookings that live in oyun. The app anonymises the bookings it loads per request
-- (the last 90 days); this covers the rest. erase_account() anonymises every booking of an account or player
-- (name, phone, account link, review name), keeps the money and slot data for tax records, then removes the
-- oyun player row, or anonymises it when other records still point at it. Returns how many bookings changed.
-- Safe to run again. Run after 20261017000000.

create or replace function oyun.erase_account(p_account_id text, p_player_legacy_id text default null)
returns int language plpgsql as $$
declare
  pl uuid[];
  n int := 0;
begin
  if coalesce(p_account_id, '') = '' and coalesce(p_player_legacy_id, '') = '' then
    raise exception 'account_required' using errcode = 'P0001';
  end if;
  pl := array(select id from oyun.players
               where (p_account_id <> '' and clerk_user_id = p_account_id)
                  or (p_player_legacy_id is not null and legacy_id = p_player_legacy_id));

  update oyun.bookings set
    customer_name = 'Deleted Player',
    customer_phone = '0000000000',
    player_id = null,
    meta = case
             when meta ? 'review' and jsonb_typeof(meta->'review') = 'object'
               then jsonb_set(meta - 'accountId', '{review,name}', '"Verified Player"')
             else meta - 'accountId'
           end
   where (player_id = any(pl) or (p_account_id <> '' and meta->>'accountId' = p_account_id))
     and (customer_name is distinct from 'Deleted Player' or player_id is not null or meta ? 'accountId');
  get diagnostics n = row_count;

  begin
    delete from oyun.players where id = any(pl);
  exception when foreign_key_violation then
    update oyun.players set name = 'Deleted Player', clerk_user_id = null, legacy_id = null,
           phone = '6' || lpad((abs(hashtext(id::text)) % 1000000000)::text, 9, '0')
     where id = any(pl);
  end;
  return n;
end $$;

create or replace function public.erase_account(p_account_id text, p_player_legacy_id text default null)
returns int language plpgsql security definer set search_path = oyun, public as $$
begin
  return oyun.erase_account(p_account_id, p_player_legacy_id);
end $$;

alter function oyun.erase_account(text, text) set search_path = oyun, public;
revoke execute on function public.erase_account(text, text) from public, anon, authenticated;
grant execute on function public.erase_account(text, text) to service_role;
