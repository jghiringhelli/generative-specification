# ADR-001: Tech Stack — TypeScript, Express, Prisma, PostgreSQL

**Status:** Accepted  
**Date:** 2026-04-17

## Context

RealWorld spec requires a complete REST API. Needed a stack with strong typing, mature ORM, and Railway compatibility.

## Decision

TypeScript + Express 4 + Prisma 5 + PostgreSQL.

## Alternatives Considered

- **Fastify**: faster but less ecosystem maturity for this domain
- **Mongoose/MongoDB**: RealWorld spec has relational data (follows, favorites, tags) — relational DB is a better fit
- **Drizzle ORM**: less mature migration tooling than Prisma at time of writing

## Consequences

- Prisma requires `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` for Alpine Docker images
- `prisma migrate deploy` runs on container start — zero-downtime deploys require backward-compatible migrations
- Strong typing propagates from Prisma schema through repositories to API response types
