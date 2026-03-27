# ADR-0001: Technology Stack — TypeScript 5 + Node 20 + Express 4 + Prisma 5 + PostgreSQL 16

## Status

Accepted

## Date

2025-01-01

## Context

The Conduit RealWorld API is a REST API for a blogging platform with authentication, article management, commenting, following, and tagging capabilities. A technology stack must be chosen that satisfies the following non-negotiable requirements:

1. Strong static type safety to catch interface mismatches and null-dereference bugs at compile time.
2. Support for the layered hexagonal (ports-and-adapters) architecture required by the project specification.
3. Testability in isolation — services must be unit-testable without a running database by swapping repository implementations via dependency injection.
4. First-class PostgreSQL support with schema migration tooling (not just schema-sync).
5. Active LTS support through at least 2026 to ensure security patch coverage.
6. Deployable to standard Node.js hosting (Fly.io, Railway, Render, AWS ECS).

## Decision

**Language/Runtime**: TypeScript 5 on Node.js 20 LTS

TypeScript 5 provides improved type inference, `const` type parameters, and decorator metadata. Node 20 is the current LTS with Active support through April 2026 and Maintenance through April 2028. Static typing catches missing fields, wrong argument types, and null-unsafe property access at compile time — all common failure modes in data-heavy REST APIs. The TypeScript compiler's `strict` mode is enabled, including `strictNullChecks`, `noImplicitAny`, and `strictPropertyInitialization`.

**HTTP Framework**: Express 4

Express 4 is industry-proven, minimal, and the most widely audited Node.js HTTP framework. Its middleware model is a natural fit for JWT auth middleware, error boundaries, and request validation at the route layer. Express 5 was in Release Candidate at decision time and is not yet production-stable. `npm audit` reports zero HIGH/CRITICAL CVEs on `express@4.21`.

**ORM / Query Builder**: Prisma 5

Prisma generates a fully-typed client from the database schema, meaning every query return type is verified at compile time. It provides `prisma migrate dev` for local development and `prisma migrate deploy` for CI/production deployment — proper migration history, not destructive schema-sync. Its introspection tooling catches schema drift early.

**Database**: PostgreSQL 16

PostgreSQL is an ACID-compliant relational database with native JSON column support, full-text search, and row-level locking. The Conduit domain (users, articles, comments, followers, favorites) is inherently relational — follower graphs and favorite counts require multi-table joins that are idiomatic in PostgreSQL but awkward in document stores. PostgreSQL 16 is available on every major cloud provider (AWS RDS, Google Cloud SQL, Supabase, Neon, Fly Postgres).

## Alternatives Considered

| Alternative | Rejected because |
|---|---|
| Fastify instead of Express | Heavier plugin model; `fastify-plugin` wrapping for DI is less transparent than Express middleware. Express is more widely audited for auth/security concerns. |
| Hono instead of Express | Promising edge-runtime framework but too new for production commitment. Insufficient security audit history as of decision date. |
| NestJS (wrapping Express) | NestJS imposes decorator-heavy conventions that make hexagonal architecture harder to enforce. Its module system obscures DI wiring. For a specification experiment, transparent architecture is preferred over framework magic. |
| TypeORM instead of Prisma | TypeORM 0.3 has known circular dependency issues and its decorator-based entity definition couples the domain model to the ORM. Prisma schema-first approach keeps domain models clean. |
| Drizzle instead of Prisma | Excellent type safety but younger ecosystem and weaker migration tooling maturity at decision date. |
| MySQL instead of PostgreSQL | Inferior JSON handling; weaker row-level locking semantics; inconsistent NULL-in-unique-index behavior. |
| SQLite instead of PostgreSQL | No row-level locking for concurrent API traffic; not representative of production database behavior. |

## Consequences

**Positive**:
- End-to-end type safety from HTTP boundary through service layer to database queries.
- Prisma-generated types ensure repository return types are always in sync with the schema — desync is a compile error, not a runtime failure.
- Node 20 LTS guarantees security patches through 2028.
- PostgreSQL's `prisma migrate` history is fully reproducible: any fresh environment reaches the same schema by replaying migrations.

**Negative**:
- TypeScript compilation adds a build step (`tsc`). CI must run `prisma generate` before `tsc --noEmit` or types will be missing.
- Express 4's async error handling does not automatically catch rejected Promises in async route handlers. All async handlers must either be wrapped in an `asyncHandler` utility or use try/catch blocks forwarding to `next(err)`.

**Risk and Mitigation**:
- _Risk_: Prisma client generation is a prerequisite for type checking — if `generate` is skipped, the CI pipeline will report false type errors. _Mitigation_: `prisma generate` is an explicit step before `tsc --noEmit` in both the CI workflow and developer setup documentation.
- _Risk_: `noUnusedLocals` and `noUnusedParameters` in `tsconfig.json` can cause friction during development. _Mitigation_: Prefix intentionally unused parameters with `_` per the ESLint rule `argsIgnorePattern: "^_"`.
