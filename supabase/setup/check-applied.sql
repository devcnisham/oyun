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
      and exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'oyun' and p.proname = 'sync_turf_to_venue'))
) as t(step, what, applied)
order by step;
