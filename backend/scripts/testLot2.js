/**
 * @file scripts/testLot2.js
 * @description Quick smoke-test for all Lot-2 API endpoints.
 * Usage:
 *   TEST_TOKEN="eyJ..." TEST_EVENT_ID="64f..." node scripts/testLot2.js
 */
require('dotenv').config();
const http = require('http');

const BASE     = `http://localhost:${process.env.PORT || 5000}/api`;
const TOKEN    = process.env.TEST_TOKEN    || '';
const EVENT_ID = process.env.TEST_EVENT_ID || '';

const req = (method, path, body) => new Promise((resolve) => {
  const payload = body ? JSON.stringify(body) : null;
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${TOKEN}`,
      ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
    },
  };
  const r = http.request(`${BASE}${path}`, opts, (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
      catch  { resolve({ status: res.statusCode, body: data }); }
    });
  });
  r.on('error', (e) => resolve({ status: 0, error: e.message }));
  if (payload) r.write(payload);
  r.end();
});

const check = (label, res, expectedStatus) => {
  const expected = expectedStatus || 200;
  const ok = Array.isArray(expected) ? expected.includes(res.status) : res.status === expected;
  console.log(`${ok ? '✅' : `❌ (${res.status})`} ${label}`);
  if (!ok) console.log(`   → ${res.body?.message || res.error || ''}`);
};

(async () => {
  console.log('\n🧪 EventPass — Lot 2 Smoke Tests\n');
  if (!TOKEN || !EVENT_ID) {
    console.log('⚠️  Usage: TEST_TOKEN="eyJ..." TEST_EVENT_ID="64f..." node scripts/testLot2.js');
    process.exit(1);
  }

  check('Recommendations',                    await req('GET', '/recommendations'),             200);
  check('Similar events',                     await req('GET', `/events/${EVENT_ID}/similar`),  200);
  check('Reviews (public)',                   await req('GET', `/reviews/event/${EVENT_ID}`),   200);
  check('Messages history',                   await req('GET', `/messages/${EVENT_ID}`),        [200, 403]);
  check('Unread count',                       await req('GET', `/messages/${EVENT_ID}/unread-count`), [200, 403]);
  check('Gallery',                            await req('GET', `/photos/${EVENT_ID}`),          [200, 403]);
  check('My certificates',                    await req('GET', '/certificates/my'),             200);
  check('Verify cert (invalid → 404)',        await req('GET', '/certificates/verify/INVALID'), 404);

  console.log('\n✅ Done — manual tests needed for POST endpoints (reviews, generate certs, upload photos).\n');
})();
