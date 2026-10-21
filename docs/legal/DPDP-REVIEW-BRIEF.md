# DPDP Act 2023: review brief (DRAFT)

What to check, taken from the product and the live Privacy page (`/privacy`).

## Data held
| Data | Whose | Why | Shared with | Kept |
|---|---|---|---|---|
| Name, mobile, booking details, amount, status | Players | Create bookings, check-in, support | The booked turf; hosting and database providers | Up to 8 years for tax records, then anonymised by the retention job |
| Wallet, cashback, referrals, refunds | Players | Run wallet and rewards | Hosting and database providers | Same |
| Name, email, phone, business name, GSTIN, address, bank details for payouts | Turf owners and staff | Listing, payouts, invoices | Hosting and database providers | While the account is active, then per tax law |
| Device id cookie `oyun_device`; name/number/bookings saved in the browser | Visitors | Hold slots; prefill checkout | None (stays on the device, except the cookie id) | Cookie lifetime |
| IP, browser, pages | Visitors | Security, error fixing | Hosting provider | Up to 90 days |
| Analytics | Visitors who accept | Improve the site | Analytics provider | Aggregated |
| Student ID image (student offers) | Students | Verify the discount | Admin only | `[CONFIRM]` |

## How rights are handled today
- **Access and export:** `/api/privacy/export` returns a copy of the data tied to the signed-in person.
- **Erasure:** `/api/privacy/delete` removes the account and scrubs identifiers from past bookings, keeping accounting records.
- **Consent:** analytics only after "Accept all" in the cookie banner; withdraw from Profile, then Cookie settings (`/api/privacy/consent`).
- **Retention:** a scheduled job (`/api/cron/retention-purge`, daily) anonymises old bookings and applies the retention windows.
- **Grievance officer:** named on `/privacy` section 10. `[OWNER: confirm name and contact]`

## Questions for the reviewer
1. Is OYUN a data fiduciary for player data and are turfs separate fiduciaries or processors for the data they receive? Which clauses does that change in the partner agreement?
2. Is the consent notice (cookie banner plus Privacy page) enough, or is a separate itemised notice needed at sign-up and checkout?
3. Are the retention periods (8 years bookings, 90 days logs) justified, and should bank details have their own period?
4. Cross-border transfer: hosting and database regions (Vercel `sin1`, Supabase `ap-northeast-1`), Clerk (US), analytics. Anything to disclose or restrict?
5. Children: Privacy section 8 wording versus the verifiable parental consent rule.
6. Breach process: who notifies the Board and affected people, and in what time? (See `docs/RUNBOOKS.md`.)
7. Student ID images: lawful basis, access, and deletion period.
