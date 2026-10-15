-- OYUN database setup: pin search_path on the oyun functions. Safe to run again.

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
