# OYUN codebase map

A visual guide to how OYUN works: the pages, who uses them, how a booking flows through the code, where data lives and how changes ship. Diagrams are Mermaid, so GitHub renders them. Per-rule flowcharts (hold, price, book, cancel, check-in, refund, login and more) are in `docs/FLOWCHARTS.md`. Text docs that go deeper: `docs/ARCHITECTURE.md` (rules and limits), `docs/adr/` (why), `docs/SECURITY.md`, `docs/ENVIRONMENTS.md`, `docs/SLOT-BOOKING-DB.md` (target database).

OYUN is a multi-sport turf and court booking site for Mangalore (football, box cricket, badminton, pickleball). One Next.js 16 app serves the website and the backend; there is no separate API server or mobile app.

## 1. The system at a glance

```mermaid
flowchart LR
  subgraph People
    P[Player]
    O[Owner / staff]
    A[Admin]
  end
  subgraph Vercel["Vercel (one Next.js 16 app)"]
    PX[proxy.ts<br/>HTTPS, cookie guard, Clerk]
    PG[Pages and layouts<br/>src/app]
    SA[Server actions<br/>src/modules/*/backend/*-actions.ts]
    ST[Store<br/>src/modules/shared/database/store.ts]
    RT[Realtime broadcast<br/>src/modules/shared/backend/realtime.ts]
  end
  subgraph Supabase
    DB[(Postgres<br/>jsonb document tables)]
    RTS[Realtime channels]
  end
  CK[Clerk<br/>player sign-in, optional]
  P --> PX
  O --> PX
  A --> PX
  PX --> PG --> SA --> ST --> DB
  ST --> RT --> RTS
  RTS -. "slot changed" ping .-> P
  PX -.-> CK
```

Key points:

- The browser never talks to the database. Everything goes through server actions that use the service-role key.
- Clerk is optional. Without keys, players use a device name-and-phone fallback.
- Admin and partner use signed cookie sessions (not Clerk).

## 2. Site map: every page and who it is for

```mermaid
flowchart TD
  subgraph PUB["Public site (src/app/(main))"]
    H["/ home"]
    AR["/arenas list + filters"]
    AD["/arenas/[id] turf page: slots, reviews, checkout"]
    TA["/turfs/[area] area landing pages"]
    LT["/list-turf partner application"]
    FAQ["/faq  /help  /privacy  /terms"]
  end
  subgraph PLY["Player account"]
    BK["/bookings my bookings"]
    BD["/bookings/[id] ticket + QR"]
    INV["/bookings/[id]/invoice"]
    CAL["/bookings/[id]/calendar .ics"]
    SV["/saved favourites"]
    PR["/profile  /settings"]
    LG["/login  /signup (Clerk)"]
  end
  subgraph PAR["Partner dashboard (/partner)"]
    PL["/partner/login"]
    PD["/partner overview"]
    PB["bookings"]
    CI["check-in"]
    SL["slots (block, walk-in)"]
    CA["calendar (week view)"]
    PP["pricing"]
    OF["offers"]
    AO["add-ons"]
    RV["reviews"]
    PO["payouts (+ CSV export)"]
    PI["invoices/[id]"]
    PT["turf profile"]
    ST["staff"]
  end
  subgraph ADM["Admin console (/admin)"]
    AL["/admin/login"]
    AH["overview"]
    AT["turfs and turfs/[id] approvals"]
    APR["partners"]
    AU["users"]
    ATX["transactions"]
    ARV["review moderation"]
    ACU["customization"]
    ASE["settings and promo codes"]
  end
  H --> AR --> AD --> BD
  H --> TA --> AD
  AD --> BK
  BD --> INV
  BD --> CAL
  LT -. approved by admin .-> AT
  PL --> PD
  AL --> AH
```

API routes (not pages): `/api/health` (launch checks and storage mode), `/api/holds/release` (release holds when a tab closes), `/api/client-error` (browser errors to the error webhook).

## 3. Who can do what

```mermaid
flowchart LR
  subgraph Roles
    PL[Player]
    FD[Front desk]
    MG[Manager]
    OW[Owner]
    AM[Admin]
  end
  PL --> p1[Browse, hold, book, cancel own, review, wallet]
  FD --> f1[bookings, checkin, slots:<br/>walk-ins, check-in, no-show, block slots]
  MG --> m1[Front desk plus pricing, offers,<br/>add-ons, turf profile]
  OW --> o1[Manager plus staff and payouts]
  AM --> a1[Approve turfs, partners, refunds, bans, wallet adjust, promo, site content]
```

Rule in code: every admin action calls `requireAdmin()` and every partner action calls `requirePartnerAction(permission)` before touching data. `src/test/cross-cutting/authorization.test.ts` fails if an action lacks its guard. Permission sets (`PERMISSIONS` in `src/modules/shared/backend/partner-auth.ts`): front desk = bookings, checkin, slots; manager adds pricing, offers, addons, turf; owner adds staff and payouts.

## 4. How a booking works (end to end)

```mermaid
sequenceDiagram
  autonumber
  actor Pl as Player
  participant UI as Turf page (browser)
  participant SA as booking-actions.ts
  participant S as store.ts mutate()
  participant DB as Postgres
  participant RT as Realtime
  Pl->>UI: open /arenas/[id], pick day
  UI->>SA: getSlotsForDate()
  SA-->>UI: slots (free, held, booked, blocked, past)
  Pl->>UI: choose slots, Proceed
  UI->>SA: holdSlots() (8 minutes, device cookie)
  SA->>S: mutate(add holds)
  S->>DB: apply_changes(changes, expected_rev)
  S->>RT: broadcast slots:{turf}:{date}
  RT-->>UI: other viewers see "held"
  Pl->>UI: confirm checkout
  UI->>SA: quoteSelection() then createBookings()
  SA->>S: mutate(price, check, insert bookings)
  S->>DB: apply_changes (unique indexes guard double booking)
  DB-->>S: ok or store_conflict (retry up to 5x)
  SA-->>UI: booking id and code SA-XXXXXX
  UI-->>Pl: ticket page with QR, invoice, calendar file
```

Why it cannot double book: `apply_changes` only writes if the global revision still equals what the server loaded (otherwise `store_conflict` and retry), and partial unique indexes on bookings, blocks and holds reject a second live row for the same turf, date and hour. `scripts/sql-race-test.sh` proves this in CI.

### Booking states

```mermaid
stateDiagram-v2
  [*] --> Held: holdSlots (8 min)
  Held --> [*]: expires or released
  Held --> Confirmed: createBookings
  Confirmed --> CheckedIn: partner check-in (QR or code)
  Confirmed --> Cancelled: player (2 h before) or partner
  Confirmed --> NoShow: partner marks
  Cancelled --> Refunded: admin refund
  CheckedIn --> Reviewed: player review
  Reviewed --> [*]
```

Only `confirmed` and `checked_in` occupy a slot. A multi-hour booking is one booking row per hour. The advance is recorded, not charged online; the rest is paid at the turf.

## 5. Inside a write: the store

```mermaid
flowchart TD
  A[Server action calls mutate fn] --> B[load_changes since my revision<br/>cold start loads all]
  B --> C[Run fn on a private copy]
  C --> D[Diff into upserts and deletes]
  D --> E{apply_changes<br/>revision still expected?}
  E -- yes --> F[Commit in one transaction]
  E -- no --> G[store_conflict]
  G --> H[Reload and retry up to 5 times with jitter]
  H --> B
  F --> I[after: broadcast slot ping and revalidate pages]
```

## 6. Data model

All data lives in 14 jsonb document tables (`id`, `seq`, `data`, `updated_at`) in `supabase/setup/1-tables.sql`, plus `app_meta` for the revision counter. TypeScript shapes are in `src/modules/shared/database/types.ts`.

```mermaid
erDiagram
  PARTNER ||--o{ TURF : owns
  PARTNER ||--o{ STAFF : employs
  TURF ||--o{ BOOKING : receives
  TURF ||--o{ BLOCK : "has blocked hours"
  TURF ||--o{ HOLD : "has held hours"
  TURF ||--|| PRICING : "has rules"
  TURF ||--o{ OFFER : runs
  TURF ||--o{ ADDON : sells
  PLAYER ||--o{ BOOKING : makes
  PLAYER ||--o{ WALLET_TXN : has
  BOOKING ||--o| REVIEW : "may have"
  BOOKING }o--o| PROMO_CODE : uses
  APPLICATION }o--|| PARTNER : "becomes on approval"
  SETTINGS ||--|| SITE_CONTENT : "platform-wide"
```

Not exact foreign keys: relationships live inside the JSON and are enforced by code, apart from the unique indexes and the CHECK constraints in `supabase/setup/7-check-constraints.sql`.

## 7. Source tree

```mermaid
flowchart TD
  ROOT[oyun/]
  ROOT --> SRC[src/]
  ROOT --> SUP[supabase/<br/>migrations, setup SQL, tests]
  ROOT --> E2E[e2e/ Playwright]
  ROOT --> SCR[scripts/ SQL tests, tracker, Jira export]
  ROOT --> DOC[docs/]
  ROOT --> GH[.github/ CI, Dependabot, PR template]
  SRC --> APP["app/ routes: (main), (auth), admin, partner, api"]
  SRC --> COMP[components/ Navbar, TurfCard, Invoice, dash, auth, consent]
  SRC --> LIB[lib/ business logic]
  SRC --> UT[utils/supabase/ server, admin, client, middleware]
  SRC --> PXY[proxy.ts]
  LIB --> L1[booking-actions, admin-actions, partner-actions, auth-actions]
  LIB --> L2[store, realtime, slot-topic, seed, schema]
  LIB --> L3[pricing, cancel-policy, wallet, sports, time]
  LIB --> L4[session, partner-auth, password, rate-limit, login-throttle]
  LIB --> L5[queries, public-turf, reports, launch-checks, monitoring]
  LIB --> L6[client/ hooks: device, favourites, use-slot-updates]
  LIB --> L7[validation/ application, site-content]
```

| Area | What lives there |
| --- | --- |
| `src/app/(main)` | Public and player pages |
| `src/app/partner`, `src/app/admin` | Dashboards; each has a `/login` and a `(dashboard)` group guarded in its layout |
| `src/modules/*/backend/*-actions.ts` | Server actions: the only write path |
| `src/modules/shared/database/store.ts` | `getDb()` read, `mutate(fn)` write, revision lock, delta sync |
| `src/modules/shared/lib/pricing.ts` | One function prices both the quote and the charge |
| `src/modules/shared/backend/session.ts`, `partner-auth.ts` | Signed cookie sessions, roles, permissions |
| `src/modules/web/database/public-turf.ts` | Narrow shape sent to the browser (no owner link or commission) |
| `src/modules/shared/backend/launch-checks.ts` | The checks behind `/api/health` and the admin banner |

## 8. Pricing and the checkout total

```mermaid
flowchart LR
  BASE[Base hourly rate<br/>by pitch size] --> RULES[Pricing rules<br/>peak, weekend, last-minute]
  RULES --> OFFER[Best offer<br/>happy hour, first-time]
  OFFER --> ADD[Add-ons]
  ADD --> PROMO[Promo code<br/>end date, total uses, per-player]
  PROMO --> WAL[Wallet credit]
  WAL --> TOT[Total and advance<br/>10% of the hour, within min and max]
```

## 9. Realtime slot updates

```mermaid
flowchart LR
  W[Any write that changes slots] --> B["after(): broadcast on slots:turf:date"]
  B --> C[Supabase Realtime]
  C --> V1[Browser A use-slot-updates]
  C --> V2[Browser B use-slot-updates]
  V1 --> R1[refetch getSlotsForDate]
  V2 --> R2[refetch getSlotsForDate]
```

The payload is only a ping; clients refetch from the server, so no data leaks through the public channel.

## 10. Login and sessions

```mermaid
flowchart TD
  subgraph Player
    PA{Clerk keys set?}
    PA -- yes --> CL[Clerk session]
    PA -- no --> DV[Device name and phone fallback]
  end
  subgraph "Admin / Partner"
    LF[login form] --> TH[throttle per role+email+IP and per IP]
    TH --> PW[scrypt password check]
    PW --> CO[signed httpOnly cookie]
    CO --> PXG[proxy.ts optimistic check]
    PXG --> LY[layout verifies again on the server]
  end
```

## 11. From code to production

```mermaid
flowchart LR
  T[Task in Jira OYUN-n] --> BR[Branch feature/OYUN-n-name]
  BR --> PR[Pull request with the key in its title]
  PR --> CI{CI checks}
  CI --> C1[lint, 0 warnings]
  CI --> C2[tsc]
  CI --> C3[npm audit]
  CI --> C4[Vitest]
  CI --> C5[build]
  CI --> C6[SQL tests, Postgres 17]
  CI --> C7[Playwright desktop + mobile]
  C1 & C2 & C3 & C4 & C5 & C6 & C7 --> OK[All green]
  OK --> MG[Merge to main]
  MG --> VP[Vercel Production]
  PR --> VV[Vercel Preview per branch]
  MG --> TR[Update build tracker, Jira Done, ticks]
```

## 12. Feature map

```mermaid
mindmap
  root((OYUN))
    Players
      Browse by area and sport
      Live slot map
      Hold 8 minutes
      Book, pay at turf
      Ticket QR, invoice, calendar
      Cancel, review
      Wallet, referrals, promo codes
      Saved turfs
    Owners and staff
      Check-in by QR or code
      Walk-ins and blocks
      Dynamic pricing and offers
      Add-ons
      Reviews
      Payouts and GST invoices
      Staff roles
    Admin
      Approve turfs and partners
      Refunds and disputes
      Commission and settings
      Promo codes
      Site content and sponsors
      Ban players, adjust wallet
    Platform
      SEO pages and sitemap
      Installable web app
      Cookie consent
      Health checks
      Error webhook
```

Not built yet (see `docs/FEATURE-LIST.md` and the tracker): real payments (Razorpay), automated WhatsApp or SMS, map and filters, waitlist and recurring bookings, find players, Kannada.

## 13. Where to start reading

1. `src/app/(main)/arenas/[id]/page.tsx` and its client components: the turf page and checkout.
2. `src/modules/web/backend/booking-actions.ts`: hold, quote, create, cancel (the server-side booking planner lives in `booking-plan.ts`; request/quote types, `MAX_SLOTS` and request cleaning in client-safe `booking-types.ts`).
3. `src/modules/shared/database/store.ts` and `supabase/setup/3-apply-changes.sql`: how writes stay safe.
4. `src/modules/shared/lib/pricing.ts`: slot grid and prices.
5. `src/proxy.ts`, `src/modules/shared/backend/session.ts`, `src/modules/shared/backend/partner-auth.ts`: who may do what.
6. `e2e/` and `src/modules/**/*.test.ts`: the behaviour the project promises.

## 14. Roadmap

Source of truth for order and gates: `docs/TASK-WORKFLOW.md`. Task ids (P9-05, R011 and so on) are in `docs/build-tracker.html` and Jira (project OYUN, find by `[id]` in the summary). Status is as of 10 Oct 2026.

### 14.1 The path to launch

```mermaid
flowchart LR
  A["A. Safe and real<br/>key history checked, data parity"]
  B["B. Foundations<br/>tests, CI, hooks, staging"]
  C["C. Security fixes<br/>small and urgent"]
  D["D. Database v2<br/>resources, bookables, exclusion constraints"]
  E["E. Payments<br/>Razorpay"]
  F["F. Performance and UX"]
  G["G. Features<br/>notifications, map, calendar, extras"]
  H["H. Quality and launch<br/>privacy, backups, SEO, monitoring"]
  A --> B --> C --> D --> E --> F --> G --> H
  classDef done fill:#d1fae5,stroke:#059669,color:#065f46;
  classDef doing fill:#fef3c7,stroke:#d97706,color:#92400e;
  classDef todo fill:#f1f5f9,stroke:#64748b,color:#334155;
  class A,B doing;
  class C doing;
  class D,E,F,G,H todo;
```

### 14.2 Roadmap by area

| Area | Done | Next | Needs the owner first |
| --- | --- | --- | --- |
| **A. Safe and real** | Git history checked for leaked keys | Local and Vercel data parity (P8-00c) | Set `SUPABASE_SECRET_KEY` locally; rotate any key found |
| **B. Foundations** | Next 16 notes, typecheck and hook, Dependabot and `npm audit`, race test, authorization sweep, Playwright flows | Hold-expiry test (P8-05), persistent rate limits (R011 / P9-06) | Staging: Vercel and Supabase branch setup (P8-12) |
| **C. Security** | Hard-coded credentials removed, `server-only`, wallet refund on cancel, DTOs, lockout per email and IP, promo limits, image URL validation, CHECK constraints (file ready) | Anonymous ticket actions (P9-05), wallet bound to Clerk account (P9-03), cash-collected check-in (P9-11), CSP nonces (P9-13), unused Supabase proxy step (P9-16) | Rotate old Supabase key and admin and partner passwords (P9-01); run `7-check-constraints.sql` on production; choose admin MFA: TOTP or Clerk (P9-09) |
| **D. Database v2** | Design in `docs/SLOT-BOOKING-DB.md` and `supabase/proposals/` | Migration and RPC wrappers, venue to resources mapping, multi-court venues (R007), any slot length (R009), one order per checkout (R010), retire jsonb for bookings (R008), per-turf version (P10-02) | Approve production runs: pg_cron hold expiry (P10-06), deleting old tables |
| **E. Payments** | Advance is recorded, nothing charged online | Razorpay order and signature (P11-01), idempotent webhook (P11-02), advance mode (P11-03), gateway refunds (P11-04), payment-state tests (P11-06), wallet ledger (R013), payouts and GST invoices, reconciliation (P11-05) | Razorpay account and test keys |
| **F. Performance and UX** | `loading.tsx` and skeletons | Page caching with tags (P10-03), Realtime plus on-focus refetch instead of 10 s poll (P10-04), k6 load test (P10-08) | Supabase Storage for image optimisation (P10-09) |
| **G. Features** | Multi-sport, favourites, calendar and WhatsApp share, owner offers, staff roles, reviews, partner week calendar | Search filters (P13-04), waitlist and recurring weekly (P13-06), split payment link, find players (P13-01), tournaments (P13-02), weather alerts (P13-03), admin analytics (P13-05), Kannada (P13-07) | Choose WhatsApp or SMS provider (P12-01 to P12-05); choose Google Maps or Mapbox |
| **H. Quality and launch** | `docs/SECURITY.md`, architecture and ADRs | CI concurrency test, accessibility (axe), Lighthouse 90, bad-path tests, DPDP export and delete, SEO landing pages, monitoring (double bookings must be 0), runbooks | Backup restore runbook needs the Supabase plan and a tested restore; uptime service choice |

### 14.3 Roadmap by feature (who gets what)

```mermaid
flowchart TD
  subgraph Players
    P1["Now: browse, hold, book, ticket, cancel, review, wallet, promo, saved"]
    P2["Next: wallet tied to account, book again, reschedule"]
    P3["Later: waitlist, recurring, split payment, find players, tournaments, weather, Kannada"]
    P1 --> P2 --> P3
  end
  subgraph Owners
    O1["Now: check-in, walk-ins, blocks, pricing, offers, add-ons, staff, payouts CSV, invoices"]
    O2["Next: owner alerts, real payouts"]
    O3["Later: real payouts and reconciliation, owner alerts by WhatsApp or SMS"]
    O1 --> O2 --> O3
  end
  subgraph Admin
    A1["Now: approve turfs, refunds, commission, promo, site content, moderation"]
    A2["Next: per-user accounts, MFA, session revocation, audit log"]
    A3["Later: analytics by area, hour and conversion"]
    A1 --> A2 --> A3
  end
  subgraph Platform
    L1["Now: CI, health checks, headers, race test, Playwright"]
    L2["Next: persistent rate limits, staging, CSP nonces, caching, Realtime"]
    L3["Later: database v2, Razorpay, monitoring and backups, SEO pages, DPDP tools"]
    L1 --> L2 --> L3
  end
```

### 14.4 Gates that stop the queue

| Gate | Blocks | Owner action |
| --- | --- | --- |
| Production key and password rotation | P9-01, safe launch | Set new values in Vercel, redeploy |
| Production SQL not yet run | CHECK constraints (OYUN-232 / P9-21) | Run `supabase/setup/7-check-constraints.sql` in the Supabase SQL editor |
| Preview has no database | Ticket page on preview and git-main deployments | Add Preview Supabase and auth variables in Vercel |
| Razorpay | All of E | Open account, give test keys |
| Notification provider | P12-01 to P12-05 | Choose WhatsApp or SMS |
| Map provider | P13-04 | Choose Google Maps or Mapbox |
| Admin MFA design | P9-09 | Choose TOTP or Clerk |
| Staging | P8-12 | Vercel and Supabase branch setup |

The loop that works the queue: `/next-task` picks the first open non-gated task, branches, builds, tests, opens a PR; merges happen only when every CI check is green.
