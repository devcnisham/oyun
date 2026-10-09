-- Database-side guards for money (task P9-14). All the data lives in jsonb, so a code bug could
-- otherwise write a negative wallet balance or a negative amount. These CHECKs refuse such writes.
--
-- NOT VALID: the rule is enforced for every new insert and update, but rows already stored are not
-- scanned, so this cannot fail on old data. After checking the data, validate once with
--   alter table public.players validate constraint players_wallet_not_negative;   (and the others)
-- A missing field is allowed (the check passes on NULL); a value that is present must be a valid number.
-- Safe to run again.

do $$
declare c record;
begin
  for c in select * from (values
    ('players',     'players_wallet_not_negative',    $c$((data->>'walletBalance')::numeric >= 0)$c$),
    ('bookings',    'bookings_amounts_not_negative',  $c$((data->>'amountPaid')::numeric >= 0 and (data#>>'{pricing,total}')::numeric >= 0 and (data#>>'{pricing,walletDeduction}')::numeric >= 0)$c$),
    ('turfs',       'turfs_price_positive',           $c$((data->>'pricePerHour')::numeric > 0)$c$),
    ('promo_codes', 'promo_codes_value_not_negative', $c$((data->>'value')::numeric >= 0 and (data->>'uses')::numeric >= 0)$c$)
  ) as v(tbl, name, expr)
  loop
    if not exists (
      select 1 from pg_constraint
      where conname = c.name and conrelid = format('public.%I', c.tbl)::regclass
    ) then
      execute format('alter table public.%I add constraint %I check (%s) not valid', c.tbl, c.name, c.expr);
    end if;
  end loop;
end $$;
