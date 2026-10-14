-- OYUN database setup, step 11: pg_cron job to purge expired holds.
-- Runs every minute to clear lapsed holds from oyun.holds.
-- Safe to re-run.

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema extensions;
    -- Remove any existing job with the same name first to avoid duplicates
    if exists (select 1 from pg_tables where schemaname = 'cron' and tablename = 'job') then
      perform cron.unschedule(jobid) from cron.job where jobname = 'expire-holds-every-minute';
      perform cron.schedule('expire-holds-every-minute', '* * * * *', 'select oyun.expire_holds()');
    end if;
  else
    raise notice 'pg_cron extension is not available in pg_available_extensions; skipping cron.schedule';
  end if;
end $$;
