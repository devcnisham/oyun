# OYUN codebase map

A visual guide to how OYUN works: the pages, who uses them, how a booking flows through the code, where data lives and how changes ship. Diagrams are Mermaid, so GitHub renders them. Text docs that go deeper: `docs/ARCHITECTURE.md` (rules and limits), `docs/adr/` (why), `docs/SECURITY.md`, `docs/ENVIRONMENTS.md`, `docs/SLOT-BOOKING-DB.md` (target database).

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
    SA[Server actions<br/>src/lib/*-actions.ts]
    ST[Store<br/>src/lib/store.ts]
    RT[Realtime broadcast<br/>src/lib/realtime.ts]
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

Rule in code: every admin action calls `requireAdmin()` and every partner action calls `requirePartnerAction(permission)` before touching data. `src/lib/authorization.test.ts` fails if an action lacks its guard. Permission sets (`PERMISSIONS` in `src/lib/partner-auth.ts`): front desk = bookings, checkin, slots; manager adds pricing, offers, addons, turf; owner adds staff and payouts.

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

All data lives in 14 jsonb document tables (`id`, `seq`, `data`, `updated_at`) in `supabase/setup/1-tables.sql`, plus `app_meta` for the revision counter. TypeScript shapes are in `src/lib/types.ts`.

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
| `src/lib/*-actions.ts` | Server actions: the only write path |
| `src/lib/store.ts` | `getDb()` read, `mutate(fn)` write, revision lock, delta sync |
| `src/lib/pricing.ts` | One function prices both the quote and the charge |
| `src/lib/session.ts`, `partner-auth.ts` | Signed cookie sessions, roles, permissions |
| `src/lib/public-turf.ts` | Narrow shape sent to the browser (no owner link or commission) |
| `src/lib/launch-checks.ts` | The checks behind `/api/health` and the admin banner |

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
  T[Task in Jira OYUN-n] --> BR[Branch claude/OYUN-n-name]
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

Not built yet (see `FEATURE_LIST.md` and the tracker): real payments (Razorpay), automated WhatsApp or SMS, map and filters, waitlist and recurring bookings, find players, Kannada.

## 13. Where to start reading

1. `src/app/(main)/arenas/[id]/page.tsx` and its client components: the turf page and checkout.
2. `src/lib/booking-actions.ts`: hold, quote, create, cancel.
3. `src/lib/store.ts` and `supabase/setup/3-apply-changes.sql`: how writes stay safe.
4. `src/lib/pricing.ts`: slot grid and prices.
5. `src/proxy.ts`, `src/lib/session.ts`, `src/lib/partner-auth.ts`: who may do what.
6. `e2e/` and `src/lib/*.test.ts`: the behaviour the project promises.
