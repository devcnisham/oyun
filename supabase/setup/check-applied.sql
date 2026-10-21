-- OYUN: which setup steps does this database already have? READ ONLY, changes nothing.
-- Paste the whole file into Supabase → SQL Editor and run. Every row says yes or NO.
select step, what, applied from (values
  (1, '1-tables: store tables and unique indexes',
      (select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('turfs','bookings','holds','app_meta')) = 4
      and exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'players_phone_uniq')),
  (2, '2-load-state: load_state()',
      exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'load_state')),
  (3, '3-apply-changes: apply_changes()',
      exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'apply_changes')),
  (4, '4-reset-and-permissions: reset_state()',
      exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'reset_state')),
  (5, '5-delta-sync: load_changes(), rev columns, deleted_rows',
      exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'load_changes')
      and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'bookings' and column_name = 'rev')
      and exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'deleted_rows')),
  (6, '6-half-pitch: pitch_part and per-half unique indexes',
      exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'bookings' and column_name = 'pitch_part')
      and exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'bookings_live_half_a_uniq')),
  (7, '7-check-constraints: CHECK constraints on store tables',
      exists (select 1 from pg_constraint c join pg_namespace n on n.oid = c.connamespace where n.nspname = 'public' and c.contype = 'c' and c.conrelid::regclass::text in ('bookings','public.bookings'))),
  (8, '8-rate-limits: rate_limits table and rl_hit()',
      exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'rate_limits')
      and exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'rl_hit')),
  (9, '9-slot-booking-v2: schema oyun and public RPC wrappers',
      exists (select 1 from information_schema.schemata where schema_name = 'oyun')
      and exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'hold_slots')),
  (10, '10-map-turfs-to-venues: mapped venues, resources, bookables',
      exists (select 1 from information_schema.tables where table_schema = 'oyun' and table_name = 'venues')
      and exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'oyun' and p.proname = 'sync_turf_to_venue')),
  (11, '11-pg-cron-expire-holds: pg_cron expire holds every minute',
      to_regclass('cron.job') is not null
      or not exists (select 1 from pg_available_extensions where name = 'pg_cron')),
  (16, '16-row-level-conflicts: apply_changes() checks touched rows, not the global revision',
      exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'apply_changes' and p.prosrc like '%clash%')),
  (17, '17-v2-priced-confirm: oyun.bookings meta/legacy_id and confirm_hold_priced()',
      exists (select 1 from information_schema.columns where table_schema = 'oyun' and table_name = 'bookings' and column_name = 'legacy_id')
      and exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'confirm_hold_priced')),
  (18, '18-v2-booking-updates: apply_booking_updates()',
      exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'apply_booking_updates')),
  (19, '19-v2-book-and-move: book_ranges() and move_booking()',
      exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'move_booking')),
  (20, '20-persist-remaining-collections: payouts, waitlist, open_matches, tournaments, activity tables',
      exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'payouts')
      and exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'store_tables')),
  (21, '21-release-payment-event: release_payment_event()',
      exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'release_payment_event')),
  (22, '22-v2-backfill: backfill_legacy_bookings() and parity_report()',
      exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'parity_report')),
  (15, '15-payment-events: processed_payment_events and claim_payment_event()',
      exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'processed_payment_events')
      and exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'claim_payment_event'))
) as t(step, what, applied)
order by step;
