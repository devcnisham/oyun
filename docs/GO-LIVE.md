# Going live

Everything the site needs before launch day. Do the steps in order; each takes a few minutes.

## 1. Database (Supabase project `nimfjwxzolkwiyqmnaat`)

1. Open supabase.com → your project → **SQL Editor** → **New query**.
2. Run the five files in `supabase/setup/` **in order**, one at a time
   (`1-tables.sql`, `2-load-state.sql`, `3-apply-changes.sql`, `4-reset-and-permissions.sql`, `5-delta-sync.sql`):
   open a new query, paste the **whole** file, make sure **no text is highlighted** (the editor runs only the
   highlighted part), and click **Run**. Each step should say "Success. No rows returned".
   A project set up before 7 October 2026 only needs `5-delta-sync.sql`. Until it runs the site still works,
   but every request downloads every table.
   They are safe to run again. (They are the same SQL as `supabase/migrations/…oyun_store.sql`, split into
   small pieces; you can also run that one file instead.)
3. **Only if** you tested the site against this database before (demo bookings, iPhone giveaway…):
   run `supabase/reset-before-launch.sql` once. ⚠️ It deletes all data. Never run it after launch.
4. Go to **Project Settings → API Keys** and copy the **secret** key (`sb_secret_…`).

## 2. Vercel environment variables

Vercel → **slot-arena** → **Settings → Environment Variables**. Tick **Production** and **Preview** for each.

| Name | Type | Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Config | `https://nimfjwxzolkwiyqmnaat.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Config | `sb_publishable_…` (Supabase → API Keys) |
| `SUPABASE_SECRET_KEY` | Secret | `sb_secret_…` from step 1.4 |
| `SESSION_SECRET` | Secret | any long random text, at least 32 characters |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Secret | your admin login for `/admin` |
| `PARTNER_EMAIL` / `PARTNER_PASSWORD` | Secret | the OYUN operations login for `/partner` (runs the launch turfs) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Config / Secret | already added |
| `NEXT_PUBLIC_SITE_URL` | Config | your final address, e.g. `https://oyun.in` |

Then **Deployments → ⋯ → Redeploy**. The first page load fills the empty database with the 10 launch turfs.

**Without `SUPABASE_SECRET_KEY` the live site does not save bookings**: each Vercel server keeps its own temporary copy,
so players can't see each other's holds and bookings disappear. This step is required.

## Check it's connected

Open `https://<your-site>/api/health`. You want `"ready": true`, `"storage": "supabase"` and
`"bookingsSharedBetweenPlayers": true`. The admin dashboard also shows a red warning while bookings are not being saved.

## 3. Real-time slot updates

Nothing to set up: when anyone holds, books or releases a slot, everyone looking at that turf and day sees it change
within a second (Supabase Realtime), with a refresh every 10 seconds as a safety net. If you turned off
**Realtime → Settings → "Allow public access"** in Supabase, turn it back on.

## 4. Before Monday (admin and partner dashboards)

- **Admin → Settings:** set the real support phone and email (shown on invoices, Terms and Privacy).
  Cashback and referral rewards start **off**; switch them on only if you will fund the wallet credits.
- **Admin → Turfs** (or Partner → Turf profile): for each of the 10 turfs, check the price, opening hours, photos and add
  the turf's real contact number. Mark a turf **Verified** only after you have visited it.
- **Admin → Customization:** edit the home-page promo card if you want a launch offer.
- **Clerk dashboard:** User & authentication → turn on **Phone number** and **First and last name** (required).
  Delete the old secret key that was shared in chat.
- Make a test booking on the live site from two phones: one holds a slot, the other should see **On hold** at once.
  Then check it in from `/partner/check-in` and cancel it.

## How payments work at launch

Players reserve online and **pay at the turf** (cash or UPI). The booking shows "Pay at venue ₹…", and on check-in the
partner dashboard says how much to collect. Online payments (Razorpay) can be added later.
