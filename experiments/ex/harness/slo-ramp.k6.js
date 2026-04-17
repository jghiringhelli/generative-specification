/**
 * L4 SLO ramp test — Conduit API
 *
 * Scenario: mixed read/write load across all major endpoint groups.
 * Ramp: 0 → 10 VUs over 30s, sustain 10 VUs for 2 min, ramp 10 → 0 over 30s.
 * Total: ~3 minutes.
 *
 * Thresholds reflect Railway single-replica free tier:
 *   - p95 < 2s (read endpoints routinely < 200ms; auth inflates due to bcrypt)
 *   - p99 < 4s
 *   - error rate < 1%
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

const BASE_URL = __ENV.API_URL || "https://conduit-api-production-b94f.up.railway.app";

const readLatency = new Trend("read_latency", true);
const writeLatency = new Trend("write_latency", true);
const errorRate = new Rate("scenario_errors");

export const options = {
  stages: [
    { duration: "30s", target: 10 },  // ramp up
    { duration: "2m",  target: 10 },  // sustain
    { duration: "30s", target: 0  },  // ramp down
  ],
  thresholds: {
    http_req_duration:   ["p(95)<2000", "p(99)<4000"],
    http_req_failed:     ["rate<0.01"],
    read_latency:        ["p(95)<1000"],
    write_latency:       ["p(95)<2000"],
    scenario_errors:     ["rate<0.01"],
  },
};

export default function () {
  const vu = __VU;

  // Even VUs: read-heavy scenario (articles + tags + profiles)
  if (vu % 2 === 0) {
    const t0 = Date.now();

    const articles = http.get(`${BASE_URL}/api/articles?limit=10`);
    readLatency.add(Date.now() - t0);
    const ok1 = check(articles, {
      "articles 200":           (r) => r.status === 200,
      "articles array present": (r) => Array.isArray(r.json("articles")),
      "articlesCount is int":   (r) => Number.isInteger(r.json("articlesCount")),
    });
    errorRate.add(!ok1);

    const tags = http.get(`${BASE_URL}/api/tags`);
    const ok2 = check(tags, {
      "tags 200":         (r) => r.status === 200,
      "tags array present": (r) => Array.isArray(r.json("tags")),
    });
    errorRate.add(!ok2);

    sleep(1);
  } else {
    // Odd VUs: write scenario (register → login → get current user)
    const uid = `ramp_${__VU}_${Date.now()}`;

    const t0 = Date.now();
    const reg = http.post(
      `${BASE_URL}/api/users`,
      JSON.stringify({ user: { username: uid, email: `${uid}@ramp.test`, password: "ramppass123" } }),
      { headers: { "Content-Type": "application/json" } }
    );
    writeLatency.add(Date.now() - t0);

    const ok1 = check(reg, { "register 201": (r) => r.status === 201 });
    errorRate.add(!ok1);
    if (!ok1) { sleep(2); return; }

    const token = reg.json("user.token");

    const t1 = Date.now();
    const login = http.post(
      `${BASE_URL}/api/users/login`,
      JSON.stringify({ user: { email: `${uid}@ramp.test`, password: "ramppass123" } }),
      { headers: { "Content-Type": "application/json" } }
    );
    writeLatency.add(Date.now() - t1);
    const ok2 = check(login, { "login 200": (r) => r.status === 200 });
    errorRate.add(!ok2);

    const me = http.get(`${BASE_URL}/api/user`, {
      headers: { Authorization: `Token ${token}` },
    });
    readLatency.add(me.timings.duration);
    const ok3 = check(me, { "get user 200": (r) => r.status === 200 });
    errorRate.add(!ok3);

    sleep(2); // bcrypt makes writes slow — pace write VUs accordingly
  }
}

export function handleSummary(data) {
  const d = data.metrics.http_req_duration.values;
  const failed = data.metrics.http_req_failed.values;
  return {
    stdout: `
=== L4 SLO Ramp Test Summary ===
Duration:   ${data.state.testRunDurationMs / 1000}s
Requests:   ${data.metrics.http_reqs.values.count}
p50:        ${d.med.toFixed(0)}ms
p95:        ${d['p(95)'].toFixed(0)}ms
p99:        ${d['p(99)'].toFixed(0)}ms
error_rate: ${(failed.rate * 100).toFixed(2)}%
read p95:   ${data.metrics.read_latency?.values['p(95)']?.toFixed(0) ?? 'n/a'}ms
write p95:  ${data.metrics.write_latency?.values['p(95)']?.toFixed(0) ?? 'n/a'}ms
================================
`,
  };
}
