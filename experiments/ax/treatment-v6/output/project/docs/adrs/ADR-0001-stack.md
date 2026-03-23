# ADR-0001 — Stack Selection

**Status**: Accepted  
**Date**: 2024-01-01  
**Deciders**: Engineering team

---

## Context

We are implementing the RealWorld Conduit API as part of the Generative Specification experiment (treatment-v6). The stack must support:

1. A RESTful JSON API with authentication, authorization, and relational data (users, articles, comments, tags, follows, favorites)
2. Type safety to reduce runtime errors and improve maintainability
3. Rapid development with well-established tooling and community support
4. A relational database with complex join patterns (articles + tags, followers, favorites)
5. Production-grade deployment on standard cloud infrastructure

The Generative Specification methodology requires the stack to be declared before implementation begins so the AI can apply consistent patterns throughout. Stack drift mid-session produces inconsistent code.

---

## Decision

**TypeScript 5 + Node 20 + Express 4 + Prisma 5 + PostgreSQL 16**

### TypeScript 5
TypeScript 5 provides strict static typing, decorator support, and excellent IDE integration. The `strict: true` flag catches entire categories of runtime errors at compile time. The TypeScript 5 series introduces const type parameters, satisfies operator improvements, and faster type-checking — all material for a project of this complexity.

### Node 20 (LTS)
Node 20 is the current LTS release with Active support until April 2026. It includes native fetch, improved ESM support, and the V8 11.3 engine with significant performance improvements over Node 18. The LTS cadence provides stability without sacrificing modern APIs.

### Express 4
Express 4 is the most widely deployed Node.js HTTP framework with 10+ years of production hardening. Its middleware model is well-understood, its ecosystem is mature, and its simplicity matches the hexagonal architecture requirement: Express handles HTTP adaptation; business logic lives in services that have no Express imports.

**Alternatives considered:**
- **Fastify**: Higher throughput benchmarks, but its plugin system (encapsulation model) conflicts with the composition-root DI pattern required by the architecture. Express's unopinionated design makes the DI wiring cleaner.
- **Hono**: Excellent performance and TypeScript-first design, but too new (2023) for a regulated experiment condition. Insufficient community audit coverage.
- **NestJS**: Opinionated framework with built-in DI, but its decorator-heavy pattern conflicts with the spec requirement for ZERO decorator usage and creates implicit magic that violates the explicit-over-clever engineering preference.

### Prisma 5
Prisma 5 is the most ergonomic TypeScript ORM with excellent type generation, migration tooling (`prisma migrate`), and schema-as-code. Its generated `PrismaClient` provides type-safe queries without raw SQL for the common paths. Prisma's query engine handles connection pooling and prepared statements correctly.

**Alternatives considered:**
- **TypeORM**: Decorator-based, which conflicts with the spec. Active CVEs in the 0.3.x series.
- **Drizzle**: Excellent type safety, but migration story is less mature than Prisma at time of writing. Community size is smaller, reducing audit coverage.
- **Knex**: Raw SQL query builder; more control but more boilerplate. Prisma's generated types reduce an entire class of typo bugs.
- **Raw pg**: Maximum control but no schema management, no type generation. Disproportionate maintenance overhead for this project size.

### PostgreSQL 16
PostgreSQL 16 is the current stable release with full ACID compliance, excellent JSON support, and mature Prisma driver. The relational model (users → articles → tags, followers, favorites) fits the relational paradigm naturally. PostgreSQL 16 adds logical replication improvements and query planner improvements over 15.

**Alternatives considered:**
- **MySQL 8**: Compatible but PostgreSQL has better JSON operators, better window function support, and the Prisma PostgreSQL adapter is better maintained.
- **SQLite**: Excellent for local dev but unsuitable for multi-instance production deployment (no concurrent write support).
- **MongoDB**: Document model does not map well to the highly relational Conduit data model (followers, favorites, tags are natural join tables).

---

## Consequences

**Positive:**
- Full type safety from HTTP boundary to database via Prisma's generated types
- Prisma migrations provide a complete audit trail of schema changes
- Express's middleware model maps cleanly to the hexagonal architecture's driving-adapter pattern
- PostgreSQL's maturity reduces operational risk

**Negative:**
- Prisma adds a build step (prisma generate) — mitigated by CI pipeline automation
- Express 4 lacks native async error handling (requires wrapper or middleware) — mitigated by the AppError middleware pattern
- PostgreSQL requires a running service (Docker) for local development — documented in .env.example

**Risks:**
- Express 5 (currently RC) will require minor migration when stable — plan to upgrade within 6 months of GA release
- Prisma 6 migration cadence is fast — pin minor versions in package.json
