# Load test (P10-08)

`scripts/k6/browse.js` loads the public read path (home, arenas list, a turf page) with a peak-evening ramp.
Thresholds: under 1% failed requests and 95th percentile under 1.5 s.

## Run it
Install k6 (https://grafana.com/docs/k6/latest/set-up/install-k6/), start the app, then:

```bash
npm run build && npx next start -p 3000
k6 run -e BASE_URL=http://localhost:3000 scripts/k6/browse.js
k6 run -e BASE_URL=https://<staging-host> -e PEAK_VUS=200 scripts/k6/browse.js
```

## Rules
- Local or staging only. Do not point it at production (`nimfjwxzolkwiyqmnaat`, the live site) without the owner approving the run: it creates real load and real database reads.
- A local `next start` on a laptop measures your laptop. For numbers that mean something, use staging (P8-12).

## What is not covered
The booking itself (hold, book, cancel) goes through Next.js server actions, whose action ids change on every build, so a plain HTTP script cannot replay them reliably. That path is covered by:
- `scripts/sql-race-test.sh`: parallel sessions on one slot give one booking (runs in CI, `npm run test:sql`).
- `e2e/booking.spec.ts`: the full flow in a browser.

To load-test writes, add a small dev-only route handler behind a secret and call that from k6; ask the owner first.
