# ADR-0001: Backend Technology Stack

- **Status:** Accepted
- **Date:** 2026-09-15
- **Deciders:** Backend engineering team

## Context

We are building the Conduit (RealWorld) backend: a medium-sized JSON API exposing
user authentication, profiles, articles, comments, favorites, and tags. The service
must be maintainable, strongly typed, testable in isolation via a ports-and-adapters
architecture, and deployable to a standard container platform against a relational
database. We need a stack that offers first-class type safety across the entire
request lifecycle, a mature HTTP layer, and a database access layer that generates
types from the schema so the domain and persistence layers stay in sync. The team's
existing expertise, the size of the surrounding ecosystem, and long-term support
windows are all decision factors, because the codebase is expected to live for years
and be maintained by rotating contributors.

## Decision

We adopt the following stack:

- **TypeScript 5** — end-to-end static typing, strict mode enabled, catching contract
  violations at compile time rather than runtime.
- **Node 20 (LTS)** — long-term support runtime with stable performance and broad
  library compatibility.
- **Express 4** — minimal, battle-tested HTTP framework with a vast middleware
  ecosystem; the driving-adapter layer stays thin and delegates to services.
- **Prisma 5** — type-safe ORM/query builder that generates a typed client from a
  declarative schema, powering our repository adapters and migrations.
- **PostgreSQL 16** — robust relational database with strong constraint support for
  the many-to-many relationships (favorites, follows, tags) in the domain.

## Alternatives Considered

- **Fastify instead of Express** — faster benchmarks and built-in schema validation,
  but a smaller middleware ecosystem and less team familiarity. Rejected to reduce
  onboarding risk.
- **NestJS** — batteries-included structure, but heavyweight for this scope and
  imposes its own DI opinions that conflict with our hand-rolled composition root.
- **TypeORM / Sequelize instead of Prisma** — weaker type generation and migration
  ergonomics. Prisma's generated client aligns with our type-safety goal.
- **MySQL / SQLite** — SQLite is unsuitable for concurrent production writes;
  PostgreSQL's richer constraint and indexing support fits the relational model best.

## Consequences

- **Positive:** compile-time safety from HTTP boundary to database row; generated
  Prisma types remove a class of drift bugs; large hiring pool; simple containerized
  deployment.
- **Negative:** Prisma's generated client requires a build step (`prisma generate`)
  in CI and locally; Express requires explicit typing discipline for middleware.
- **Neutral:** we own the dependency-injection composition root rather than delegating
  it to a framework, which is by design for the hexagonal architecture.
