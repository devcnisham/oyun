# OYUN flowcharts

One flowchart per rule or process, each drawn from the code it names. Companion to `docs/CODEBASE-MAP.md` (the big picture, site map, data model and roadmap). Mermaid, so GitHub renders them.

Contents: 1 slot status, 2 hold, 3 price, 4 create booking, 5 cancel, 6 check-in, 7 no-show, 8 admin refund, 9 wallet and rewards, 10 turf application and approval, 11 admin and partner login, 12 route guard, 13 action error handling, 14 is booking open, 15 pull request to release.

## 1. What status does a slot show?

`getSlots` in `src/lib/pricing.ts`. Order matters: the first rule that matches wins.

```mermaid
flowchart TD
  S([Slot hour on a date]) --> P{Date and hour already started?<br/>walk-ins may use the current hour}
  P -- yes --> PAST[past]
  P -- no --> B{Live booking takes it?<br/>full: any booking<br/>half: both halves booked}
  B -- yes --> BOOKED[booked]
  B -- no --> K{Owner blocked this hour?}
  K -- yes --> BLOCKED[blocked]
  K -- no --> H{Enough free halves?<br/>full needs both, half needs one<br/>not counting this device's own hold<br/>expired holds ignored}
  H -- no --> HELD[held by someone else]
  H -- yes --> AV[available]
  AV --> Y{This device holds it?}
  Y -- yes --> HY[available + heldByYou]
```

Booking statuses that count as taken: confirmed, checked_in, no_show. Cancelled and refunded free the slot.

## 2. Hold a slot (`holdSlots`)

```mermaid
flowchart TD
  A([Proceed clicked]) --> R{Booking open on this site?<br/>see chart 14}
  R -- no --> E1[Error: database not connected]
  R -- yes --> T{Under rate limit?<br/>60 per IP, 15 per device<br/>per 10 minutes}
  T -- no --> E2[Error: too many attempts]
  T -- yes --> D{Date is today or up to a week ahead?}
  D -- no --> E3[Error: pick a date within the next week]
  D -- yes --> M[mutate:]
  M --> PU[Purge expired holds]
  PU --> RP[Drop this device's earlier holds]
  RP --> L{Each chosen hour available<br/>and a free part exists?}
  L -- no --> E4[Error: slot taken or being booked<br/>nothing is held]
  L -- yes --> H[Add hold rows, expire in 8 minutes]
  H --> BC[Broadcast slot ping, return fresh slots]
```

A hold lasts 8 minutes (`HOLD_MINUTES`). Leaving the checkout or closing the tab calls `releaseHolds` (`/api/holds/release` for the tab-close beacon).

## 3. How the price is built (`buildQuote`)

The same function builds the quote and the charge.

```mermaid
flowchart TD
  A([Turf, date, hour, size]) --> B[Hourly rate<br/>full pitch or half-pitch percent]
  B --> PK{Peak window?}
  PK -- yes --> PK1[+ peak percent]
  PK -- no --> WE
  PK1 --> WE{Weekend?}
  WE -- yes --> WE1[+ weekend percent]
  WE -- no --> LM
  WE1 --> LM{Today and within<br/>last-minute window?}
  LM -- yes --> LM1[- last-minute percent<br/>of the marked-up price]
  LM -- no --> SP
  LM1 --> SP[Slot price]
  SP --> OF{Online booking?}
  OF -- yes --> OF1[Best single offer<br/>happy hour or first-time<br/>offers do not stack]
  OF -- no --> PR
  OF1 --> PR{Promo code?}
  PR -- yes --> PR1{Active, in date, uses left,<br/>weekend rule, per-player limit}
  PR1 -- ok --> PR2[Subtract discount]
  PR1 -- not ok --> PE[promoError, no discount]
  PR -- no --> AD
  PR2 --> AD
  PE --> AD[Add add-ons<br/>quantity capped at 20 each]
  AD --> ST[Subtotal, never below add-ons]
  ST --> WL{Use wallet?}
  WL -- yes --> WL1[Deduct min of balance and subtotal]
  WL -- no --> TT
  WL1 --> TT[Total]
  TT --> AV[Advance: percent of total<br/>within configured min and max]
```

Walk-in bookings skip offers and the first-time check.

## 4. Create a booking (`createBookings` and `planBooking`)

```mermaid
flowchart TD
  A([Confirm booking]) --> O{Booking open?}
  O -- no --> X1[Error]
  O -- yes --> CK{Clerk enabled and<br/>not signed in?}
  CK -- yes --> X2[Error: sign in to book]
  CK -- no --> V{Name given, phone has 10 digits,<br/>date in range?}
  V -- no --> X3[Field error]
  V -- yes --> TH{Under rate limit?<br/>30 per IP, 10 per device}
  TH -- no --> X4[Error: too many attempts]
  TH -- yes --> MU[mutate:]
  MU --> PU[Purge expired holds]
  PU --> PL[Find or create player by phone<br/>banned: refuse]
  PL --> LP[For each hour: build quote]
  LP --> SE{Any slot or promo error?}
  SE -- yes --> X5[Throw: nothing written]
  SE -- no --> PT[Pick pitch part: own hold, else first free]
  PT --> BK[Insert booking row per hour<br/>status confirmed, pay at venue]
  BK --> WD[Wallet deduction per hour]
  WD --> PC[Count promo use once per checkout]
  PC --> RH[Release this device's holds]
  RH --> OK([Return booking ids, show ticket])
```

If two people reach `apply_changes` together, only one wins: the revision lock raises `store_conflict` for the other, which reloads and finds the slot gone. The unique index is the last backstop.

## 5. Player cancels (`cancelMyBooking`)

```mermaid
flowchart TD
  A([Cancel clicked]) --> ID{Id looks like bk_ + 12 hex?}
  ID -- no --> N1[Booking not found]
  ID -- yes --> TH{Under rate limit, 20 per IP}
  TH -- no --> N2[Too many attempts]
  TH -- yes --> F{Booking exists?}
  F -- no --> N1
  F -- yes --> AC{Made while signed in<br/>and a different account?}
  AC -- yes --> N3[Sign in with the booking's account]
  AC -- no --> ST{Status is confirmed?}
  ST -- no --> N4[Can no longer be cancelled]
  ST -- yes --> CU{Online booking and<br/>at least 2 hours before slot?}
  CU -- no --> N5[Please call the turf]
  CU -- yes --> RF{Refund due and player known?}
  RF -- yes --> W[Credit wallet, status refunded]
  RF -- no --> C[Status cancelled]
  W --> FREE([Slot opens for others live])
  C --> FREE
```

`refundDue`: wallet credit used at booking plus any amount really paid in. An "advance" amount that was only recorded is not refunded because nothing was charged.

## 6. Partner checks a player in (`checkInBooking`)

```mermaid
flowchart TD
  A([Enter code or scan QR]) --> P{Partner has<br/>checkin permission?}
  P -- no --> D[Access denied]
  P -- yes --> F{Booking found by code or id?}
  F -- no --> E1[No booking found]
  F -- yes --> TU{Booking is for this turf?}
  TU -- no --> E2[This booking is for another turf]
  TU -- yes --> S{Status}
  S -- checked_in --> E3[Already checked in]
  S -- other than confirmed --> E4[Booking is cancelled, refunded, no show]
  S -- confirmed --> DT{Date is today?}
  DT -- no --> E5[Booking is for another day]
  DT -- yes --> OK[Status checked_in, time stored]
  OK --> RW[Reward: cashback, and referral credit<br/>on a referred player's first game]
  RW --> PV{Pay at venue?}
  PV -- yes --> PD[Mark paid in full at the desk]
  PV -- no --> BL[Show balance to collect]
```

## 7. No-show (`markNoShow`)

```mermaid
flowchart LR
  A([Partner marks no-show]) --> P{checkin permission}
  P -- no --> D[Denied]
  P -- yes --> C{Status confirmed?}
  C -- no --> E1[Only confirmed bookings]
  C -- yes --> T{Slot has started?}
  T -- no --> E2[Wait until the slot starts]
  T -- yes --> NS[Status no_show]
```

## 8. Admin refund (`refundBooking`)

```mermaid
flowchart TD
  A([Admin refunds a booking]) --> AD{Admin session?}
  AD -- no --> X[Access denied]
  AD -- yes --> S{Already cancelled or refunded?}
  S -- yes --> E[Error]
  S -- no --> M[Status refunded]
  M --> SRC{Source}
  SRC -- online and refund due --> W[Credit player's wallet]
  SRC -- walk-in --> NW[Paid at the desk: nothing credited]
  W --> CB{Was checked in with cashback?}
  NW --> CB
  CB -- yes --> TB[Take cashback back, never below zero]
  CB -- no --> END([Done])
  TB --> END
```

## 9. Wallet and rewards

```mermaid
flowchart LR
  subgraph In
    C[Cashback<br/>on check-in, capped]
    RR[Referral reward<br/>referrer, on friend's first game]
    RB[Referral bonus<br/>new player]
    RF[Refund<br/>cancel or admin refund]
    AA[Admin adjustment]
  end
  subgraph Out
    BP[Booking payment<br/>wallet credit used at checkout]
  end
  C & RR & RB & RF & AA --> W[(Wallet balance<br/>and wallet_txns history)]
  W --> BP
```

Every change goes through `walletTxn`, so the history always sums to the balance.

## 10. A turf joins OYUN

```mermaid
flowchart TD
  A([Owner opens /list-turf]) --> F[Four-step form, client validation]
  F --> BOT{Honeypot filled or<br/>submitted in under 4 s?}
  BOT -- yes --> FK[Pretend success, store nothing]
  BOT -- no --> RL{5 per hour per IP?}
  RL -- no --> E1[Try again in an hour]
  RL -- yes --> VA{Server validation passes?}
  VA -- no --> E2[Field errors]
  VA -- yes --> DU{Duplicate pending, or 3 pending<br/>for this phone?}
  DU -- yes --> E3[We already have your application]
  DU -- no --> ST[(Store pending application)]
  ST --> AM[Admin reviews /admin/turfs]
  AM --> DEC{Decision}
  DEC -- reject --> RJ[Application rejected]
  DEC -- approve --> EM{Owner email already a partner?}
  EM -- suspended --> E4[Reactivate partner first]
  EM -- yes --> UP[Reuse partner login]
  EM -- no --> NP[Create partner with temporary password<br/>shown once to the admin]
  UP --> TF[Create turf, status active]
  NP --> TF
  TF --> LV[Turf is live for booking]
```

## 11. Admin and partner login (`login`)

```mermaid
flowchart TD
  A([Submit email and password]) --> RO{Role valid and<br/>SESSION_SECRET set?}
  RO -- no --> E1[Login not configured]
  RO -- yes --> EM{Both fields filled?}
  EM -- no --> E2[Enter your email and password]
  EM -- yes --> LK{Locked?<br/>5 failures per role+email+IP<br/>20 per role+IP<br/>15 minutes}
  LK -- yes --> E3[Too many failed attempts]
  LK -- no --> CH{Credentials match?<br/>admin: env email and password<br/>partner: OYUN ops env login,<br/>or scrypt hash for owner or staff}
  CH -- no --> RF[Record failure]
  RF --> E4[Invalid email or password]
  CH -- yes --> RS[Clear failures]
  RS --> CS[Signed httpOnly session cookie]
  CS --> RD([Redirect to /admin or /partner])
```

## 12. Who may open a dashboard page?

```mermaid
flowchart TD
  R([Request to /admin or /partner]) --> DEV{Local dev<br/>login skipped?}
  DEV -- yes --> OKP([Allow])
  DEV -- no --> LG{Valid signed cookie for this role?}
  LG -- no --> LOGIN([Redirect to the role's /login])
  LG -- yes --> LAY[Dashboard layout verifies the session again on the server]
  LAY --> PERM{Partner page needs a permission<br/>the role has?}
  PERM -- no --> HOME([Redirect to /partner])
  PERM -- yes --> PAGE([Render page])
  PAGE --> ACT[Each action checks again before touching data]
```

The proxy check is optimistic (cookie only); the layout and every action are the real guard.

## 13. How action errors reach the screen

```mermaid
flowchart LR
  F[Form submit or server action] --> A[run wrapper]
  A --> OK{Throws?}
  OK -- no --> R[refreshAll: revalidate site layout]
  R --> M[Return ok message]
  OK -- ValidationError or AccessError --> E[Return error message<br/>shown inline]
  OK -- anything else --> U[Rethrow]
  U --> EB[error.tsx boundary and client-error webhook]
```

## 14. Is booking open on this site?

`booking-availability.ts`, enforced in `holdSlots` and `createBookings`.

```mermaid
flowchart TD
  A([Hold or book]) --> S{Supabase connected?<br/>storage is shared across instances}
  S -- yes --> OPEN([Booking open])
  S -- no --> E{ALLOW_EPHEMERAL_BOOKINGS=true?}
  E -- yes --> DEMO([Open, tickets may vanish<br/>demo only])
  E -- no --> CL([Refused: database not connected])
```

`/api/health` and the admin banner report the same state (`launch-checks.ts`).

## 15. From a pull request to release

```mermaid
flowchart LR
  PR([Pull request opened]) --> CI[CI]
  CI --> A[Lint, 0 warnings]
  CI --> B[Type-check]
  CI --> C[npm audit, high]
  CI --> D[Vitest]
  CI --> E[Build]
  CI --> F[SQL tests, Postgres 17]
  CI --> G[Playwright desktop + mobile]
  A & B & C & D & E & F & G --> R{All green?}
  R -- no --> FIX[Fix and push]
  FIX --> CI
  R -- yes --> MG[Merge to main]
  MG --> PROD[Vercel production deploy]
  MG --> SYNC[Tracker, Jira issue Done, ticks]
  PR --> PV[Vercel preview deploy]
```

Database changes ship separately: idempotent SQL in `supabase/migrations/`, tested with `npm run test:sql`, then run by the owner in the Supabase SQL editor.
