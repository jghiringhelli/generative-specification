# ADR-0001: Technology Stack

- Status: Accepted
- Date: 2024-08-16

## Context

We are building the Conduit (RealWorld) backend: a medium-sized REST API that
handles user authentication, profiles, articles, comments, favorites, and tags.
The system must persist relational data with well-defined foreign-key
relationships (users, articles, comments, follows, favorites, tags), expose a
typed HTTP surface, and be maintainable by a team that values type safety,
testability, and a strong compile-time contract. We needed to choose a runtime,
a language, an HTTP framework, an ORM/data-access layer, and a database engine
that together minimize runtime surprises and support a ports-and-adapters
architecture.

## Decision

We adopt the following stack:

- **TypeScript 5** as the implementation language. Strict mode is enabled to
  catch nullability and type errors at compile time.
- **Node.js 20 (LTS)** as the runtime. It is a supported long-term-support line
  with modern ECMAScript features and stable performance.
- **Express 4** as the HTTP framework. It is mature, minimal, ubiquitous, and
  has excellent middleware ecosystem support. It maps cleanly to thin driving
  adapters that delegate to services.
- **Prisma 5** as the ORM and migration tool. Prisma provides a typed client
  generated from a declarative schema, first-class migrations, and a clean
  repository-friendly API that keeps SQL concerns behind driven adapters.
- **PostgreSQL 16** as the database. It offers robust relational integrity,
  rich indexing, case-insensitive querying options, and battle-tested
  reliability for the relational shape of Conduit's domain.

## Alternatives Considered

- **NestJS instead of Express**: powerful but heavier, with more framework
  ceremony than this project needs. Express keeps adapters thin and explicit.
- **TypeORM / Knex / raw pg instead of Prisma**: TypeORM's decorators leak
  persistence concerns into the domain; raw drivers lose compile-time safety.
  Prisma's generated types align with our strict TypeScript goals.
- **MySQL / SQLite instead of PostgreSQL**: SQLite is inadequate for concurrent
  production writes; PostgreSQL's feature set and reliability win.
- **JavaScript instead of TypeScript**: rejected because static typing is a core
  engineering value for this codebase.

## Consequences

- The team gains end-to-end type safety from the database schema to the HTTP
  boundary, reducing an entire class of runtime errors.
- Prisma migrations become the single source of truth for schema evolution.
- A PostgreSQL instance is required for local development, CI, and production;
  CI provisions a `postgres:16` service container.
- Prisma's generated client must be regenerated after schema changes
  (`prisma generate`), which is wired into the build and CI pipeline.
