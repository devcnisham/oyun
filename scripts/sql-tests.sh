#!/usr/bin/env bash
# Runs the database SQL against a throwaway Postgres: the live store migrations, then the
# slot booking v2 proposal with its test script. Never point this at production.
# Connection comes from the standard PG* variables (PGHOST, PGPORT, PGUSER, PGPASSWORD).
set -euo pipefail

case "${PGHOST:-localhost}" in
  *supabase.co*|*supabase.com*) echo "Refusing to run SQL tests against a Supabase host" >&2; exit 1 ;;
esac

PSQL=(psql -X -q -v ON_ERROR_STOP=1)
STORE_DB=oyun_ci_store
V2_DB=oyun_ci_slot_v2

fresh_db() {
  "${PSQL[@]}" -d postgres -c "drop database if exists $1" -c "create database $1"
  # The roles Supabase provides, so grants and revokes in the SQL apply as they do there
  "${PSQL[@]}" -d "$1" <<'SQL'
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;
SQL
}

echo "== Store migrations (supabase/migrations), applied twice to prove they are re-runnable"
fresh_db "$STORE_DB"
for pass in 1 2; do
  for f in supabase/migrations/*.sql; do
    echo "   pass $pass: $f"
    "${PSQL[@]}" -d "$STORE_DB" -f "$f" > /dev/null
  done
done

echo "== Money guards (CHECK constraints)"
"${PSQL[@]}" -d "$STORE_DB" -f supabase/tests/check_constraints_test.sql

echo "== Data mapping from turfs to venues, resources, bookables (#134)"
"${PSQL[@]}" -d "$STORE_DB" -f supabase/tests/data_mapping_test.sql

echo "== Priced confirm_hold (v2 integration phase 1)"
"${PSQL[@]}" -d "$STORE_DB" -f supabase/tests/v2_priced_confirm_test.sql

echo "== Booking updates (v2 integration phase 3)"
"${PSQL[@]}" -d "$STORE_DB" -f supabase/tests/v2_booking_updates_test.sql

echo "== Book ranges and move booking"
"${PSQL[@]}" -d "$STORE_DB" -f supabase/tests/v2_book_and_move_test.sql

echo "== Persisted collections (payouts, waitlist, matches, tournaments, activity)"
"${PSQL[@]}" -d "$STORE_DB" -f supabase/tests/persist_collections_test.sql

echo "== Payment event claim and release"
"${PSQL[@]}" -d "$STORE_DB" -f supabase/tests/payment_events_test.sql

echo "== Backfill and parity (v2 integration phase 5)"
"${PSQL[@]}" -d "$STORE_DB" -f supabase/tests/v2_backfill_test.sql

echo "== Shared rate limits"
"${PSQL[@]}" -d "$STORE_DB" -f supabase/tests/rate_limits_test.sql

echo "== Check applied setup steps (supabase/setup/check-applied.sql)"
"${PSQL[@]}" -d "$STORE_DB" -f supabase/setup/check-applied.sql

echo "== Double-booking race (parallel sessions on the live store functions)"
bash scripts/sql-race-test.sh "$STORE_DB"

echo "== Slot booking v2 proposal and tests"
fresh_db "$V2_DB"
"${PSQL[@]}" -d "$V2_DB" -f supabase/proposals/slot_booking_v2.sql > /dev/null
"${PSQL[@]}" -d "$V2_DB" -f supabase/proposals/slot_booking_v2_test.sql

echo "== SQL tests passed"
