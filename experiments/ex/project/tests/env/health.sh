#!/usr/bin/env bash
# L3 env probe: Service up + DB connected
set -euo pipefail

HOST="${API_URL:-http://localhost:3000}"

echo "Probing: $HOST/health"
HTTP_CODE=$(curl -s -o /tmp/health-response.json -w "%{http_code}" "$HOST/health")

if [ "$HTTP_CODE" != "200" ]; then
  echo "FAIL: /health returned HTTP $HTTP_CODE (expected 200)"
  cat /tmp/health-response.json
  exit 1
fi

STATUS=$(jq -r '.status' /tmp/health-response.json 2>/dev/null || echo "")
if [ "$STATUS" != "ok" ]; then
  echo "FAIL: health.status='$STATUS' (expected 'ok')"
  cat /tmp/health-response.json
  exit 1
fi

DB=$(jq -r '.db' /tmp/health-response.json 2>/dev/null || echo "")
if [ "$DB" != "connected" ]; then
  echo "FAIL: health.db='$DB' (expected 'connected') — DATABASE_URL not reachable"
  exit 1
fi

echo "PASS: /health → status=ok, db=connected"
