# ADR-0001: Technology Stack Selection

## Status
Accepted

## Date
2026-09-15

## Context
The RealWorld / Conduit specification requires an idiomatic, high-performance, and maintainable backend API providing full blog publication capabilities including user authentication, profile relationships, article management, tagging, commenting, and feed filtering. To ensure long-term maintainability, developer ergonomics, and rock-solid reliability under production constraints, we evaluated application runtime environments, languages, frameworks, ORM solutions, and relational database systems.

Key architectural drivers for this decision included:
1. Strict type safety and compilation guarantees across all architectural layers (controllers, services, repositories, and entities).
2. Predictable asynchronous execution with non-blocking I/O suitable for concurrent RESTful traffic.
3. Industry-standard HTTP middleware ecosystem with low cognitive overhead and proven routing capabilities.
4. Schema-driven database interactions with automated migration workflows and complete type generation.
5. Robust relational data modeling supporting complex relational queries, foreign keys, cascades, composite indexes, and transactional consistency.

## Decision
We select the following core technology stack:
- **Language**: TypeScript 5.x configured in strict mode (`strict: true`, `target: ES2022`, `esModuleInterop: true`).
- **Runtime**: Node.js 20 LTS (Active Long Term Support), providing optimal performance, modern ECMAScript features, and enterprise stability.
- **Web Framework**: Express 4.x, offering a battle-tested HTTP layer, well-understood middleware pipeline, and seamless integration with custom domain error handlers.
- **Object-Relational Mapping (ORM)**: Prisma 5.x, providing a single source of truth database schema (`schema.prisma`), declarative migrations, and fully typed query client generation that eliminates mismatch between database schemas and application models.
- **Database**: PostgreSQL 16, offering ACID compliance, robust index types, JSON and array data operations, full-text capabilities, and high reliability.

## Alternatives Considered
- **Go / Gin**: While Go offers exceptional compiled performance and minimal memory footprint, the Conduit specification benefits significantly from TypeScript's shared ecosystem with frontend clients and rapid iterative modeling.
- **Fastify**: While Fastify delivers higher raw throughput than Express, Express 4.x was chosen due to its ubiquitous middleware ecosystem, mature tooling, and universal familiarity across engineering teams.
- **TypeORM / MikrORM / Drizzle**: TypeORM has legacy maintenance issues and decorator complexity; Drizzle is lightweight but Prisma was preferred for its robust multi-table declarative migrations and intuitive type-safe client generator.
- **MySQL / SQLite**: SQLite lacks enterprise concurrency and strict relational constraints for production deployments, while PostgreSQL 16 provides superior indexing, full-text capabilities, and transaction isolation.

## Consequences
- **Positive**:
  - End-to-end type safety from database query results to HTTP response serializations.
  - Consistent migration generation with Prisma CLI.
  - Decoupled ports-and-adapters architecture where domain logic depends on repository interfaces rather than concrete ORM instances.
- **Negative / Mitigations**:
  - Express 4 requires explicit error handling forwarding (`next(err)`) or wrapper utilities for async route handlers.
  - Prisma generates an engine binary which slightly increases deployment container sizes; mitigated by multi-stage Docker builds.
