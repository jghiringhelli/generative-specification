import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.API_URL || "https://conduit-api-production-b94f.up.railway.app";

export const options = {
  vus: 3,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<2000", "p(99)<4000"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const uid = `k6_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Register
  const reg = http.post(
    `${BASE_URL}/api/users`,
    JSON.stringify({ user: { username: uid, email: `${uid}@k6.test`, password: "k6password123" } }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(reg, { "register 201": (r) => r.status === 201 });
  if (reg.status !== 201) return;

  const token = reg.json("user.token");

  // Login
  const login = http.post(
    `${BASE_URL}/api/users/login`,
    JSON.stringify({ user: { email: `${uid}@k6.test`, password: "k6password123" } }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(login, { "login 200": (r) => r.status === 200 });

  // Get current user
  const me = http.get(`${BASE_URL}/api/user`, {
    headers: { Authorization: `Token ${token}` },
  });
  check(me, { "get user 200": (r) => r.status === 200 });
}
