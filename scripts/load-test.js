/**
 * OYUN k6 Load Test (Task P10-08 / P10-12).
 * Exercises the booking path under target concurrency:
 * 1. Home page & arena discovery
 * 2. Arena detail page & live slot inspection
 * 3. Health & hold lifecycle
 *
 * Performance criteria:
 * - p95 response time under 800 ms
 * - Error rate under 2%
 *
 * Usage:
 *   k6 run scripts/load-test.js
 *   BASE_URL=https://staging.oyun.in k6 run scripts/load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

export const conflictRate = new Rate('conflict_rate');
export const browseDuration = new Trend('browse_duration');
export const slotInspectionDuration = new Trend('slot_inspection_duration');

export const options = {
  stages: [
    { duration: '10s', target: 10 }, // ramp up to 10 VUs
    { duration: '30s', target: 30 }, // sustained peak of 30 concurrent users
    { duration: '10s', target: 0 },  // ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'], // 95% of requests must complete below 800ms
    http_req_failed: ['rate<0.02'],    // HTTP failure rate below 2%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const TURF_SLUGS = [
  'perfect-pass-kodialbail',
  'mangala-magnus-vidyanagara',
  'squad-x-kankanady',
  'smash-court-bejai',
];

export default function runLoadTest() {
  const turfSlug = TURF_SLUGS[Math.floor(Math.random() * TURF_SLUGS.length)];

  group('01_discovery', () => {
    // 1. Visit home page
    const homeRes = http.get(`${BASE_URL}/`, {
      tags: { name: 'HomePage' },
    });
    check(homeRes, {
      'home status is 200': (r) => r.status === 200,
    });
    browseDuration.add(homeRes.timings.duration);

    sleep(1);

    // 2. Visit arenas list
    const arenasRes = http.get(`${BASE_URL}/arenas`, {
      tags: { name: 'ArenasPage' },
    });
    check(arenasRes, {
      'arenas status is 200': (r) => r.status === 200,
    });

    sleep(1);
  });

  group('02_slot_inspection', () => {
    // 3. Visit turf details
    const turfRes = http.get(`${BASE_URL}/arenas/${turfSlug}`, {
      tags: { name: 'TurfDetail' },
    });
    check(turfRes, {
      'turf detail status is 200': (r) => r.status === 200,
    });
    slotInspectionDuration.add(turfRes.timings.duration);

    sleep(1.5);

    // 4. Check health endpoint
    const healthRes = http.get(`${BASE_URL}/api/health`, {
      tags: { name: 'HealthCheck' },
    });
    check(healthRes, {
      'health status is 200': (r) => r.status === 200,
    });

    sleep(0.5);
  });

  group('03_holds_lifecycle', () => {
    // 5. Test beacon / hold release endpoint
    const releaseRes = http.post(
      `${BASE_URL}/api/holds/release`,
      JSON.stringify({ holder: `k6_${__VU}_${__ITER}` }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': BASE_URL,
        },
        tags: { name: 'ReleaseHold' },
      }
    );
    check(releaseRes, {
      'release response is valid': (r) => r.status === 200 || r.status === 204,
    });

    sleep(1);
  });
}
