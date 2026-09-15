# ADR-0001: Technology Stack Selection

## Status
Accepted

## Context
The RealWorld (Conduit) specification defines a full-featured blogging platform backend requiring robust data persistence, relational data modeling (users, articles, comments, tags, follows, favorites), secure authentication, and a clean RESTful API interface. To satisfy our engineering standards, the architecture must support strong static typing, maintainability, high testability, and strict decoupling across architectural layers (driving adapters, services, domain models, and driven repository adapters). We require a modern, stable execution runtime with Long Term Support (LTS), an expressive HTTP routing library, a type-safe object-relational mapping tool, and an enterprise-grade relational database engine capable of handling complex relational queries with transactional integrity.

## Decision
We select the following technology stack for the Conduit backend application:
1. **Node.js 20 (LTS)**: Serves as the server runtime environment, providing optimal stability, performance, native fetch support, and active long-term maintenance.
2. **TypeScript 5**: Provides static typing, modern ECMAScript feature support, strict type checking (`strict: true`), interface-first contract modeling, and enhanced developer ergonomics.
3. **Express 4**: Utilized as the primary HTTP server framework and driving adapter layer. It offers a lightweight, mature, unopinionated routing engine with predictable middleware chaining and widespread community tooling.
4. **Prisma 5**: Serves as the database toolkit and ORM layer. Prisma generates strongly-typed client code from a declarative schema, preventing runtime type drift and ensuring automated, declarative database migrations.
5. **PostgreSQL 16**: Employed as the relational persistence engine. PostgreSQL delivers ACID transactions, reliable foreign key constraints, robust indexing, and standard relational operators essential for social graph relationships and article filtering.

## Alternatives Considered
- **Fastify vs. Express 4**: Fastify offers higher synthetic throughput, but Express 4 provides unmatched middleware ecosystem compatibility, simplicity, and immediate alignment with established RealWorld reference patterns.
- **TypeORM / MikroORM / Kysely vs. Prisma 5**: TypeORM suffers from maintenance volatility and decorator-heavy models that couple domain logic to persistence. Kysely is lightweight but requires manual query construction without the schema generation tooling of Prisma. Prisma 5 gives end-to-end type safety directly from database schema files.
- **MongoDB vs. PostgreSQL 16**: Document stores lack relational foreign keys and require manual data denormalization for follows and favorites, leading to eventual consistency anomalies. PostgreSQL natively models many-to-many relationships and complex relational joins with ACID guarantees.

## Consequences
- **Positive**: Complete type safety across compilation, domain contracts, and database queries. Fast test execution and rapid onboarding with standard tooling. Clean separation between domain repository interfaces and Prisma repository implementations.
- **Negative**: Prisma Client introduces a slight startup overhead and binary engine dependency. Compilation step is mandatory before execution in production environments.
