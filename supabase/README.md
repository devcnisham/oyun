# supabase

One Postgres database (schema `oyun`) serves all three products. Migrations are one flat history in `migrations/`; `setup/` is the same SQL split for the SQL editor; `tests/` holds SQL tests.

All access goes through `src/modules/shared/database/store.ts`. Primary writer per table, by function (the code does not enforce this):

| Product | Tables |
| --- | --- |
| web (players) | players, bookings, booking_items, slot_claims, payments, payment_events, wallet_ledger, promo_redemptions, booking_add_ons, reviews |
| partner (owners) | partners, partner_members, venues, opening_hours, resources, bookables, bookable_resources, price_rules, blocks, add_ons, invoices, invoice_counters, payouts, payout_items |
| admin | refunds, promo_codes, areas, sports, audit_log (and reads every table) |
| shared | rate_limits, app_meta, deleted_rows, processed_payment_events |
