# ADR-0001: Application Technology Stack

## Status

Accepted

## Context

The Conduit service requires a dependable HTTP API, strong static typing, a maintainable persistence layer, and a relational database that can represent users, follows, articles, favorites, tags, and comments without denormalizing core relationships. The implementation must be approachable to contributors while remaining suitable for production deployment. It also needs mature tooling for schema migrations, automated tests, linting, and continuous integration. The selected components must work together on the current Node.js long-term support release and avoid introducing unnecessary frameworks or proprietary runtime dependencies.

## Decision

The service will use TypeScript 5 on Node.js 20. TypeScript strict mode provides compile-time guarantees at application boundaries and supports explicit contracts for repositories and services. Express 4 will provide the HTTP routing and middleware layer because its small API, broad ecosystem, and predictable request lifecycle fit the RealWorld API well. Prisma 5 will be the database adapter and migration tool. Its generated client supplies type-safe queries while preserving PostgreSQL as the system of record. PostgreSQL 16 will store all durable application data and enforce uniqueness and referential integrity constraints.

The API will keep Express-specific concerns at the edge. Services will depend on repository interfaces, and Prisma-backed repositories will implement those interfaces. Environment variables will configure database connectivity, authentication, and server behavior.

## Alternatives Considered

NestJS was considered but rejected because its module and decorator framework adds complexity not required by this API. Fastify was considered for performance, but Express has greater familiarity and sufficient throughput for the expected workload. TypeORM and Sequelize were considered; Prisma was selected for stronger generated types and a cohesive migration workflow. SQLite was rejected because its concurrency model and feature set would not faithfully represent the production database. MongoDB was rejected because the domain has strongly relational data and benefits from database-enforced constraints.

## Consequences

The project gains a conventional, well-supported stack with strict compile-time checking and reproducible migrations. PostgreSQL must be available in development, CI, and production. Prisma-generated code becomes part of the build workflow, and upgrades must keep Prisma CLI and client versions aligned. Express handlers require deliberate validation and error middleware because Express does not impose those patterns. The architecture remains portable: repository interfaces isolate Prisma, and the compiled application runs on a standard Node.js 20 environment.
