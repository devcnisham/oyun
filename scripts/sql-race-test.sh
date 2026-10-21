#!/usr/bin/env bash
# Double-booking race test (task P8-04), at the database layer where the guarantee lives.
# Many sessions try to book the same slot at once through the real apply_changes() function:
#   A) all write the same row with the same expected revision: row-level conflict detection must let exactly one through;
#   A2) all write different rows with the same expected revision: all must succeed (no false conflicts);
#   B) each with the then-current revision: the unique index must still refuse the second booking.
# Usage: scripts/sql-race-test.sh <database that has supabase/migrations applied>. Connection from PG* variables.
set -euo pipefail

DB=${1:?database name}
PSQL=(psql -X -q -t -A -v ON_ERROR_STOP=1 -d "$DB")
N=8

booking() { # id code
  printf '{"upserts":{"bookings":[{"id":"%s","data":{"turfId":"race_turf","date":"2026-10-12","hour":18,"status":"confirmed","code":"%s","amountPaid":0,"pricing":{"total":900,"walletDeduction":0}}}]}}' "$1" "$2"
}

reset() {
  "${PSQL[@]}" -c "delete from public.bookings where data->>'turfId' = 'race_turf'" > /dev/null
}

live_count() {
  "${PSQL[@]}" -c "select count(*) from public.bookings where data->>'turfId' = 'race_turf' and status in ('confirmed','checked_in')"
}

# Start from a known revision
"${PSQL[@]}" -c "insert into public.app_meta (id, rev) values (1, 1) on conflict (id) do nothing" > /dev/null
reset

echo "== A) $N sessions write one row with the same expected revision"
REV=$("${PSQL[@]}" -c "select rev from public.app_meta where id = 1")
tmp=$(mktemp -d)
for i in $(seq 1 $N); do
  (
    if "${PSQL[@]}" -c "select public.apply_changes('$(booking "bk_race_a" "SA-RACEA$i")'::jsonb, $REV)" > "$tmp/out$i" 2> "$tmp/err$i"; then echo ok > "$tmp/res$i"; else echo fail > "$tmp/res$i"; fi
  ) &
done
wait
wins=$(cat "$tmp"/res* | grep -c '^ok$' || true)
conflicts=$(cat "$tmp"/err* | grep -c 'store_conflict' || true)
echo "   winners: $wins, store_conflict: $conflicts, live bookings: $(live_count)"
[ "$wins" = "1" ] || { echo "FAIL: expected exactly one winner, got $wins" >&2; exit 1; }
[ "$conflicts" = "$((N - 1))" ] || { echo "FAIL: expected $((N - 1)) revision conflicts, got $conflicts" >&2; cat "$tmp"/err* >&2; exit 1; }
[ "$(live_count)" = "1" ] || { echo "FAIL: expected one live booking" >&2; exit 1; }
rm -rf "$tmp"

echo "== A2) $N sessions write different rows with the same expected revision: none may conflict"
REV=$("${PSQL[@]}" -c "select rev from public.app_meta where id = 1")
tmp=$(mktemp -d)
for i in $(seq 1 $N); do
  (
    if "${PSQL[@]}" -c "select public.apply_changes('{\"upserts\":{\"players\":[{\"id\":\"pl_race_$i\",\"data\":{\"id\":\"pl_race_$i\",\"phone\":\"race$i\"}}]}}'::jsonb, $REV)" > "$tmp/out$i" 2> "$tmp/err$i"; then echo ok > "$tmp/res$i"; else echo fail > "$tmp/res$i"; fi
  ) &
done
wait
wins=$(cat "$tmp"/res* | grep -c '^ok$' || true)
echo "   winners: $wins of $N"
[ "$wins" = "$N" ] || { echo "FAIL: unrelated rows conflicted" >&2; cat "$tmp"/err* >&2; exit 1; }
distinct=$(cat "$tmp"/out* | sort -u | wc -l | tr -d ' ')
[ "$distinct" = "$N" ] || { echo "FAIL: revisions not unique ($distinct of $N)" >&2; exit 1; }
"${PSQL[@]}" -c "delete from public.players where id like 'pl_race_%'" > /dev/null
rm -rf "$tmp"

echo "== B) a server with a stale view books the same slot with the current revision: the unique index refuses it"
REV=$("${PSQL[@]}" -c "select rev from public.app_meta where id = 1")
if err=$("${PSQL[@]}" -c "select public.apply_changes('$(booking "bk_race_b1" "SA-RACEB1")'::jsonb, $REV)" 2>&1); then
  echo "FAIL: a second live booking for the same slot was accepted" >&2; exit 1
fi
echo "$err" | grep -q 'duplicate key value violates unique constraint' || { echo "FAIL: refused for the wrong reason: $err" >&2; exit 1; }
echo "   refused by the unique index; live bookings: $(live_count)"
[ "$(live_count)" = "1" ] || { echo "FAIL: expected one live booking" >&2; exit 1; }
NEW_REV=$("${PSQL[@]}" -c "select rev from public.app_meta where id = 1")
[ "$NEW_REV" = "$REV" ] || { echo "FAIL: the refused write still moved the revision ($REV -> $NEW_REV)" >&2; exit 1; }
echo "   revision unchanged after the refused write ($REV)"

echo "== C) after the booking is cancelled, the slot can be booked again"
"${PSQL[@]}" -c "update public.bookings set data = jsonb_set(data, '{status}', '\"cancelled\"') where data->>'turfId' = 'race_turf'" > /dev/null
REV=$("${PSQL[@]}" -c "select rev from public.app_meta where id = 1")
"${PSQL[@]}" -c "select public.apply_changes('$(booking "bk_race_c1" "SA-RACEC1")'::jsonb, $REV)" > /dev/null
[ "$(live_count)" = "1" ] || { echo "FAIL: expected the slot to be bookable again" >&2; exit 1; }
echo "   rebooked; live bookings: $(live_count)"

reset
echo "== Race test passed"
