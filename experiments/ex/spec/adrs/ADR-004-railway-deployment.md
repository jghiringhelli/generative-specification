# ADR-004: Railway Deployment — Docker + Managed PostgreSQL

**Status:** Accepted  
**Date:** 2026-04-17

## Context

Need a zero-config production deployment for the GS experiment that supports Dockerfile builds, managed PostgreSQL, and health checks.

## Decision

Railway with a Dockerfile builder and Railway-managed PostgreSQL plugin. `DATABASE_URL` injected via `${{Postgres.DATABASE_URL}}` variable reference.

## Key Configuration

- **Prisma binary target**: `linux-musl-openssl-3.0.x` — required for node:20-alpine; Alpine uses musl libc + OpenSSL 3
- **Runner image**: `apk add --no-cache openssl` in Dockerfile runner stage
- **Start command**: `sh -c 'npx prisma migrate deploy && node dist/server.js'` — migrations run before server starts
- **Health check**: `GET /health` → `{ status: "ok" }` — Railway polls this before marking deploy healthy
- **Rate limiting**: disabled in non-production environments to allow harness runs without hitting limits

## Consequences

- First deploy attempt failed due to missing OpenSSL on Alpine — resolved by adding `binaryTargets` and `apk add openssl`
- Rate limit must be tuned per environment: 500/min in production (configurable via env vars)
- Cold starts on Railway free tier add ~2-3s latency to first request after idle period
