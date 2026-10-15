# Going live

Everything the site needs before launch day. **Launch day: Monday 19 October 2026.** Do the steps in order; each takes a few minutes.

## 1. Database (Supabase project `duwkypegndkkgfzjgiok`)

1. Open supabase.com → your project → **SQL Editor** → **New query**.
2. Run the eight files in `supabase/setup/` **in order**, one at a time
   (`1-tables.sql`, `2-load-state.sql`, `3-apply-changes.sql`, `4-reset-and-permissions.sql`, `5-delta-sync.sql`,
   `6-half-pitch.sql`, `7-check-constraints.sql`, `8-rate-limits.sql`):
   open a new query, paste the **whole** file, make sure **no text is highlighted** (the editor runs only the
   highlighted part), and click **Run**. Each step should say "Success. No rows returned".
   A project set up before 7 October 2026 only needs `5-delta-sync.sql` and `6-half-pitch.sql`. Until 5 runs the
   site still works, but every request downloads every table. Until 6 runs, do not tick "Can be booked as two
   halves" on any turf: the old guard allows only one booking per hour, so the second half would fail to book.
   Step 8 adds the shared rate-limit counters (login lockout, holds, bookings, applications); until it runs, each
   server instance counts on its own and nothing breaks.
   Step 7 makes the database refuse a negative wallet balance, a negative booking amount, a turf priced at 0 or a
   negative promo value. It checks new writes only, so old rows cannot make it fail; it is optional but recommended.
   They are safe to run again. (They are the same SQL as `supabase/migrations/…oyun_store.sql`, split into
   small pieces; you can also run that one file instead.)
3. **Only if** you tested the site against this database before (demo bookings, iPhone giveaway…):
   run `supabase/reset-before-launch.sql` once. ⚠️ It deletes all data. Never run it after launch.
4. Go to **Project Settings → API Keys** and copy the **secret** key (`sb_secret_…`).

## 2. Vercel environment variables

Vercel → **slot-arena** → **Settings → Environment Variables**. Tick **Production** and **Preview** for each.

| Name | Type | Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Config | `https://duwkypegndkkgfzjgiok.supabase.co` |
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

### Admin and partner logins

These are the only variables the logins read. Set them for **Production** (and Preview if you test there), then redeploy.

| Login | Page | Variables it needs | Rules |
|---|---|---|---|
| Admin | `/admin/login` | `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET` | Required. Password at least 12 characters. |
| OYUN operations partner | `/partner/login` | `PARTNER_EMAIL`, `PARTNER_PASSWORD`, `SESSION_SECRET` | Optional; runs the launch turfs until each owner joins. Password at least 12 characters. |
| Turf owners and staff | `/partner/login` | none | Accounts live in the database (created when you approve a listing or an owner adds staff). |

- `SESSION_SECRET` signs both login cookies and must be random text of at least 32 characters. Make one with
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. Changing it signs everyone out.
- The email match ignores capitals and spaces; the password is exact. Changes apply on the next login after the redeploy.
- After 5 failed logins the account is locked for 15 minutes. Today this is counted per server instance (shared counting comes with R011).
- `/api/health` shows `adminLogin`, `partnerLogin`, `sessionSecretStrong` and `loginPasswordsStrong` as true or false.
  It never shows the values.

## Check it's connected

After the redeploy, open `https://<your-site>/api/health` and tick each line:

- [ ] HTTP status is **200** (it is 503 while anything below is wrong)
- [ ] `"ready": true`
- [ ] `"problems": []`
- [ ] `"storage": "supabase"`
- [ ] `"bookingsSharedBetweenPlayers": true`
- [ ] `"realtimeSlotUpdates": true` and `"realtimeBroadcast": "ok"` (the server really sent a test message)
- [ ] `"database": "ok"` and `"turfs"` is 10 or more
- [ ] `"adminLogin": true`, `"sessionSecretStrong": true` and `"loginPasswordsStrong": true`
- [ ] `"partnerLogin": true` if you use the OYUN operations login
- [ ] Sign in at `/admin/login` and at `/partner/login` with the values you set
- [ ] Sign in at `/admin`: there is **no** red "Not ready for live bookings" banner at the top

`problems` names each failing check. Until it is empty, every admin page shows a red banner listing what to fix.
The endpoint only ever reports yes/no flags, never keys or data.

## 3. Real-time slot updates

Nothing to set up: when anyone holds, books or releases a slot, everyone looking at that turf and day sees it change
within a second (Supabase Realtime), with a refresh every 10 seconds as a safety net. If you turned off
**Realtime → Settings → "Allow public access"** in Supabase, turn it back on.

It needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (browsers listen) and `SUPABASE_SECRET_KEY`
(the server sends). The two `NEXT_PUBLIC_` values are built into the page, so **redeploy after changing them**.

Check it in production:

- [ ] `/api/health` shows `"realtimeSlotUpdates": true` and `"realtimeBroadcast": "ok"`. `"failed"` means the server
  could not send a test message (wrong secret key or URL; Vercel logs show the status code). The result is cached for
  5 minutes, 1 minute after a failure.
- [ ] Open the same turf and day on two phones (one can be signed out). Hold a slot on one: the other shows it held
  within about a second, without refreshing. Let the hold lapse or release it: it frees on both.

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
