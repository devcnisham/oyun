# Switching to v2 slots (OYUN_V2_SLOTS=1)

Do this on staging first, with a copy of production data. Production only after staging passes every step.
Nothing here is automatic; each step is a command you run and a result you check.

## Before

1. Merge the v2 PRs (see `docs/V2-INTEGRATION-PLAN.md`) and deploy with the flag still off.
2. Apply the migrations in `supabase/migrations/` up to `20261023` (SQL editor, or the files in `supabase/setup/`).
   `supabase/setup/check-applied.sql` lists which steps are in.
3. Make sure every turf has a venue: `select public.sync_all_turfs_to_venues();`.

## Backfill and check

```bash
node scripts/v2-backfill.mjs            # dry run: prints what would be copied and what cannot be
node scripts/v2-backfill.mjs --apply    # copies; repeatable
node scripts/v2-backfill.mjs --parity   # public.bookings against oyun
```

Read the dry run:
- `noVenue`, `noBookable`, `noSlots`, `errors`: bookings that cannot be copied. Fix the turf or the data, run again. Do not cut over with any of these non-empty.
- `claimConflicts`: two live bookings in the old data overlap. They are copied but only one holds the slot. Look at each pair with the venue and fix the wrong one first; it means the old data had a double booking.
- Parity `ok` must be `true` (same count and money per status in both places).

## Cut over

1. Set `OYUN_V2_SLOTS=1` on staging and redeploy.
2. Walk the flow by hand: hold, checkout (with a promo and wallet), my bookings, partner check-in, cancel, reschedule, walk-in, block and unblock, recurring, payout statement.
3. Compare the partner dashboard totals for a past week with the old numbers.
4. If anything is wrong: unset the flag and redeploy. Bookings made while it was on exist only in `oyun`; copy them back or keep the flag on until fixed.

## Known limits (set the flag only if these are acceptable)

- The pages read the last 90 days of bookings; older history is fetched only by id (payout statements).
- Privacy export and erase cover every booking (export queries oyun by account; erase uses `erase_account()`, migration `20261023`). The retention purge for records older than 8 years still works only on the per-request window; nothing is that old yet.
- Half-pitch reschedule stays on the same half.
- Online payments are not wired into checkout.

## After

Only when staging and then production have run on v2 for a while with no mismatches: drop the old tables with
`supabase/setup/12-retire-legacy-jsonb-tables.sql`. This is irreversible; take a backup first.
