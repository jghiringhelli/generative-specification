# ADR-0001: Backend Technology Stack

- Status: Accepted
- Date: 2024-08-16

## Context

We are building the Conduit (RealWorld) backend: a JSON API that serves user
authentication, profiles, articles, comments, favorites, following, and tags. The
service must be strongly typed end to end, easy to test in isolation, safe to refactor
under continuous delivery, and portable across local, staging, and production
environments. The team values a hexagonal (ports and adapters) architecture in which
business logic depends only on interfaces, external I/O is confined to driven adapters,
and the framework is a replaceable detail. We also require a relational store with real
transactional guarantees because articles, favorites, and following relationships have
strong referential integrity constraints and require accurate aggregate counts.

## Decision

We adopt **TypeScript 5** on **Node 20 LTS** as the language and runtime, **Express 4**
as the HTTP driving adapter, **Prisma 5** as the persistence adapter and migration tool,
and **PostgreSQL 16** as the relational database. TypeScript with `strict: true` gives us
compile-time guarantees at every layer boundary. Node 20 is the current active LTS with
long support and native fetch/test tooling. Express 4 is a minimal, stable, well
understood HTTP layer that keeps controllers thin. Prisma 5 provides a typed client,
declarative schema, and first-class migrations, mapping cleanly onto repository ports so
the domain never imports SQL. PostgreSQL 16 gives us transactions, unique constraints,
and efficient aggregate queries for favorites and follower counts.

## Alternatives Considered

- **Fastify** instead of Express: faster and schema-first, but the team has deeper Express
  operational experience and the RealWorld surface is not throughput bound.
- **TypeORM / Knex** instead of Prisma: TypeORM's decorators leak persistence concerns into
  entities and Knex lacks type-safe models; Prisma keeps the domain framework-agnostic.
- **MongoDB** instead of PostgreSQL: the relational integrity of follows/favorites and the
  need for accurate counts favor a relational engine.
- **NestJS**: powerful DI but heavyweight; we prefer a hand-rolled composition root.

## Consequences

- Positive: uniform typing, testable ports, painless migrations, and swappable adapters
  (an in-memory repository can replace Prisma in unit tests without touching services).
- Positive: PostgreSQL constraints enforce invariants the application also validates.
- Negative: Prisma's generated client requires a build/generate step in CI and locally.
- Negative: Express 4 lacks built-in async error propagation; we mitigate with
  `express-async-errors` and a centralized error handler adapter.
