#!/usr/bin/env bash
# L3 env probe: Required environment variables present
# DEPLOYMENT-ONLY: run inside the container, not from local harness
# Skip gracefully when not in deployment context
if [ "${DEPLOYMENT_ENV:-}" != "true" ] && [ -z "${DATABASE_URL:-}" ] && [ -z "${JWT_SECRET:-}" ]; then
  echo "SKIP: env-vars probe requires deployment context (set DEPLOYMENT_ENV=true or provide DATABASE_URL+JWT_SECRET)"
  exit 0
fi
set -euo pipefail

REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET")
MISSING=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    MISSING+=("$var")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "FAIL: Missing required env vars: ${MISSING[*]}"
  exit 1
fi

# Validate DATABASE_URL format
if [[ ! "$DATABASE_URL" =~ ^postgresql?:// ]]; then
  echo "FAIL: DATABASE_URL does not look like a PostgreSQL URL"
  exit 1
fi

# Validate JWT_SECRET length (should be at least 32 chars)
if [ ${#JWT_SECRET} -lt 32 ]; then
  echo "FAIL: JWT_SECRET too short (${#JWT_SECRET} chars, minimum 32)"
  exit 1
fi

echo "PASS: All required env vars present and valid"
