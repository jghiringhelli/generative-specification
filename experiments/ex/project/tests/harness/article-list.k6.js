import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.API_URL || "https://conduit-api-production-b94f.up.railway.app";

export const options = {
  // 3 VUs * ~1 iter/sec = ~6 req/sec sustained — realistic read traffic
  vus: 3,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<2000", "p(99)<4000"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const articles = http.get(`${BASE_URL}/api/articles?limit=10`);
  check(articles, {
    "articles 200": (r) => r.status === 200,
    "has articles array": (r) => Array.isArray(r.json("articles")),
    "has articlesCount": (r) => typeof r.json("articlesCount") === "number",
  });

  const tags = http.get(`${BASE_URL}/api/tags`);
  check(tags, {
    "tags 200": (r) => r.status === 200,
    "has tags array": (r) => Array.isArray(r.json("tags")),
  });

  sleep(1); // pace to ~1 iter/VU/sec
}
