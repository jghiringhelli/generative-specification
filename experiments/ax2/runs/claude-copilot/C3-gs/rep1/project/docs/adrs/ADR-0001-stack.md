# ADR-0001: Technology Stack

- Status: Accepted
- Date: 2024-08-16

## Context

We are building the backend for a RealWorld / Conduit application: a Medium-style
social blogging platform exposing a well-defined REST API (registration, authentication,
profiles, articles, comments, favorites, tags, and a personalized feed). The team needs a
stack that offers strong static typing, a mature HTTP ecosystem, type-safe database access,
and first-class tooling for testing and continuous integration. The reference API contract
is fixed, so correctness, maintainability, and a fast feedback loop matter more than novelty.

## Decision

We adopt the following stack:

- **TypeScript 5** as the implementation language, compiled with `strict: true` to catch
  entire categories of errors at build time.
- **Node.js 20 LTS** as the runtime, giving us long-term support and modern language features.
- **Express 4** as the HTTP framework: minimal, battle-tested, and universally understood,
  with a rich middleware ecosystem for CORS, JSON parsing, and error handling.
- **Prisma 5** as the ORM and migration tool, generating a fully typed client from a single
  schema file and eliminating hand-written SQL for the common path.
- **PostgreSQL 16** as the relational datastore: ACID guarantees, robust indexing, and
  excellent support for the relational modeling this domain requires (users, follows,
  favorites, article/tag many-to-many relations).

## Alternatives Considered

- **NestJS** over bare Express: rejected as heavier and more opinionated than needed for a
  focused API of this size; the DI and module system add ceremony without proportional benefit.
- **TypeORM / Sequelize** over Prisma: rejected because Prisma's generated types and migration
  workflow deliver stronger compile-time guarantees and a simpler developer experience.
- **MongoDB** over PostgreSQL: rejected because the domain is inherently relational (follows,
  favorites, tags), where a relational engine is a more natural and safer fit.
- **Fastify** over Express: a reasonable choice, but Express's ubiquity and documentation
  lower onboarding cost for contributors.

## Consequences

- Compile-time safety across the codebase reduces runtime surprises but requires disciplined
  typing and a build step in CI.
- Prisma couples us to its schema and migration model; schema changes flow through generated
  migrations, which we run in CI against a real PostgreSQL service.
- PostgreSQL must be provisioned for local development, CI, and production, adding operational
  surface that we accept for its correctness guarantees.
- The stack is mainstream, so hiring, documentation, and community support are abundant.
