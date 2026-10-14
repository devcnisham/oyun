// k6 load test of the public read path: the pages most visitors hit before they book.
// Run against a local `next start` or staging, NEVER production without the owner's approval (see docs/LOAD-TEST.md).
//   k6 run -e BASE_URL=http://localhost:3000 scripts/k6/browse.js
//   k6 run -e BASE_URL=... -e PEAK_VUS=200 -e TURF=perfect-pass-kodialbail scripts/k6/browse.js
import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const PEAK = Number(__ENV.PEAK_VUS || 100);
const TURF = __ENV.TURF || 'perfect-pass-kodialbail';

export const options = {
  scenarios: {
    // Evening peak: ramp up, hold, ramp down
    peak: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: Math.ceil(PEAK / 4) },
        { duration: '2m', target: PEAK },
        { duration: '3m', target: PEAK },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // under 1% errors
    http_req_duration: ['p(95)<1500'], // 95% of requests under 1.5 s
    'http_req_duration{page:turf}': ['p(95)<1500'],
  },
};

function get(path, page) {
  const res = http.get(`${BASE}${path}`, { tags: { page } });
  check(res, { [`${page} 200`]: (r) => r.status === 200 });
  return res;
}

function browse() {
  group('browse', () => {
    get('/', 'home');
    sleep(1 + Math.random() * 2);
    get('/arenas', 'arenas');
    sleep(1 + Math.random() * 3);
    get(`/arenas/${TURF}`, 'turf');
    sleep(2 + Math.random() * 5);
  });
}

export default browse;
