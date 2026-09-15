# ADR-0001: Backend Technology Stack

- Status: Accepted
- Date: 2024-08-16

## Context

We are building a RealWorld / Conduit backend API that must implement the full
Conduit specification: authentication, user profiles, articles with tagging and
favoriting, comments, and social following. The system needs to be strongly
typed to reduce defect rates, use a mature and well-supported HTTP framework,
and rely on a relational database because the domain is highly relational
(users follow users, users favorite articles, articles have many tags and many
comments). We also require a data-access layer that gives us type-safe queries,
declarative schema migrations, and good tooling for local development and CI.

## Decision

We will build the service on the following stack:

- **TypeScript 5** — static typing across the entire codebase, `strict: true`
  compiler settings, and modern language features targeting ES2022.
- **Node.js 20** — the current active LTS runtime, giving us long-term support
  and modern standard-library features.
- **Express 4** — a minimal, stable, and widely understood HTTP framework with
  a large middleware ecosystem. It keeps the driving-adapter layer thin.
- **Prisma 5** — a type-safe ORM/query builder that generates a typed client
  from a declarative schema, provides first-class migrations, and integrates
  cleanly with the repository pattern used in this project.
- **PostgreSQL 16** — a robust, ACID-compliant relational database with strong
  support for the relational access patterns the Conduit domain requires.

The layered (hexagonal) architecture isolates domain and services behind
repository port interfaces, so Prisma lives only in the driven-adapter layer.

## Alternatives Considered

- **NestJS** instead of plain Express: rejected as heavier than needed for the
  scope; the framework's opinionated structure adds ceremony without clear
  benefit here, and Express keeps adapters thin and swappable.
- **TypeORM / Sequelize** instead of Prisma: rejected because Prisma provides
  superior end-to-end type safety and a better migration workflow.
- **MongoDB** instead of PostgreSQL: rejected because the domain is inherently
  relational (follows, favorites, tags, comments) and benefits from foreign
  keys, joins, and transactional integrity.
- **Fastify** instead of Express: a reasonable option, but Express's ubiquity
  and middleware ecosystem won on familiarity and stability.

## Consequences

- Strong compile-time guarantees reduce a class of runtime errors.
- Prisma migrations become the single source of truth for the schema and must
  be run in CI (`prisma migrate deploy`) and before integration tests.
- We depend on the Prisma engine binaries, which must be generated
  (`prisma generate`) as part of install/CI.
- The repository interfaces decouple business logic from Prisma, so a future
  swap of the persistence adapter (e.g., to an in-memory fake for tests) does
  not touch service code.
