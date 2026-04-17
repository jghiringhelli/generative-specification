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
  const res = http.get(`${BASE_URL}/health`);
  check(res, {
    "status 200": (r) => r.status === 200,
    "status ok": (r) => r.json("status") === "ok",
  });
}
