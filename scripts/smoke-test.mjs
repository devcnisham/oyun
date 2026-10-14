// Staging and deployment smoke test script.
// Verifies core endpoints: /api/health, /, /arenas, and /api/monitoring/double-bookings.

const baseUrl = (process.env.APP_URL || process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');

console.log(`Running smoke test suite against ${baseUrl}...`);

const checks = [
  { path: '/api/health', expectedStatus: [200, 503], validateJson: (j) => typeof j === 'object' },
  { path: '/', expectedStatus: [200], validateText: (t) => t.includes('OYUN') || t.includes('turf') || t.includes('html') },
  { path: '/arenas', expectedStatus: [200], validateText: (t) => t.includes('OYUN') || t.includes('html') },
  { path: '/api/monitoring/double-bookings', expectedStatus: [200], validateJson: (j) => Boolean(j && (j.status === 'ok' || j.ok === true) && ((j.doubleBookings ?? 0) === 0 && (j.activeDoubleBookingsCount ?? 0) === 0)) },
];

let failed = false;

for (const check of checks) {
  const url = `${baseUrl}${check.path}`;
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'OyunSmokeTest/1.0' } });
    if (!check.expectedStatus.includes(res.status)) {
      console.error(`✖ ${check.path}: Expected status [${check.expectedStatus.join(', ')}], got ${res.status}`);
      failed = true;
      continue;
    }

    if (check.validateJson) {
      const json = await res.json();
      if (!check.validateJson(json)) {
        console.error(`✖ ${check.path}: JSON validation failed:`, json);
        failed = true;
        continue;
      }
    } else if (check.validateText) {
      const text = await res.text();
      if (!check.validateText(text)) {
        console.error(`✖ ${check.path}: HTML/Text content validation failed`);
        failed = true;
        continue;
      }
    }

    console.log(`✔ ${check.path} -> ${res.status} OK`);
  } catch (err) {
    console.error(`✖ ${check.path}: Request error - ${err.message}`);
    failed = true;
  }
}

if (failed) {
  console.error('\n✖ Smoke tests failed');
  process.exit(1);
} else {
  console.log('\n✔ All smoke tests passed successfully');
  process.exit(0);
}
