-- Pin search_path on every function in the oyun schema (Supabase linter 0011, function_search_path_mutable).
-- Names inside them are then resolved from oyun and public only, not from whatever the caller set.
-- citext and btree_gist live in public, so public stays on the path. Safe to run again.

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'oyun'
       and p.prokind = 'f'
       and not exists (
         select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e'   -- skip extension-owned functions
       )
  loop
    execute format('alter function %s set search_path = oyun, public', f.sig);
  end loop;
end $$;
