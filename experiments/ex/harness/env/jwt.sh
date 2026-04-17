#!/usr/bin/env bash
# L3 env probe: JWT_SECRET is configured and auth works end-to-end
set -euo pipefail

HOST="${API_URL:-http://localhost:3000}"
TEST_UID="l3jwt_$(date +%s)"

echo "Probing: JWT_SECRET configured at $HOST"

# Register a user — proves DB is writable and JWT_SECRET is set
REG=$(curl -s -o /tmp/jwt-reg.json -w "%{http_code}" \
  -X POST "$HOST/api/users" \
  -H "Content-Type: application/json" \
  -d "{\"user\":{\"username\":\"$TEST_UID\",\"email\":\"$TEST_UID@l3.test\",\"password\":\"l3password123\"}}")

if [ "$REG" != "201" ]; then
  echo "FAIL: registration returned HTTP $REG (expected 201)"
  cat /tmp/jwt-reg.json
  exit 1
fi

TOKEN=$(jq -r '.user.token' /tmp/jwt-reg.json 2>/dev/null || echo "")
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "FAIL: no token in registration response — JWT_SECRET likely not set"
  cat /tmp/jwt-reg.json
  exit 1
fi

# Use the token on a protected endpoint — proves JWT verification works
ME=$(curl -s -o /tmp/jwt-me.json -w "%{http_code}" \
  "$HOST/api/user" \
  -H "Authorization: Token $TOKEN")

if [ "$ME" != "200" ]; then
  echo "FAIL: GET /api/user returned HTTP $ME with valid token (expected 200)"
  cat /tmp/jwt-me.json
  exit 1
fi

# Prove invalid token is rejected — confirms auth middleware is active
BAD=$(curl -s -o /dev/null -w "%{http_code}" \
  "$HOST/api/user" \
  -H "Authorization: Token invalid.token.here")

if [ "$BAD" != "401" ]; then
  echo "FAIL: invalid token returned HTTP $BAD (expected 401) — auth not enforced"
  exit 1
fi

echo "PASS: JWT_SECRET configured — register, authenticate, protect all verified"
