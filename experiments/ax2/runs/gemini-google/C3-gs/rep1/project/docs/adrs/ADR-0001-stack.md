# ADR-0001: Technology Stack Selection

## Status
Accepted

## Context
The RealWorld Conduit backend requires a robust, scalable, strongly typed, and maintainable architectural foundation capable of handling relational data models, complex query filtering (articles by tag, author, favorited status, and social feeds), authentication, and modular domain logic. We need an industry-standard technology ecosystem that provides compile-time safety, productive developer ergonomics, rich ecosystem tooling, predictable database migrations, and high execution performance.

## Decision
We select the following core stack:
1. **TypeScript 5**: Provides static typing, strict null checks, modern ECMAScript features, and excellent IDE tooling. Strong typing across domain models, DTOs, and repository interfaces eliminates broad classes of runtime bugs and simplifies refactoring.
2. **Node.js 20 LTS**: Ensures long-term runtime stability, modern V8 JavaScript engine performance, native crypto and fetch APIs, and active security maintenance.
3. **Express 4**: A lightweight, battle-tested HTTP framework offering predictable routing, extensive middleware support, and minimal overhead without imposing opinionated architectural constraints.
4. **Prisma 5**: A next-generation ORM providing a declarative schema, type-safe database client generation, automated migrations, and schema validation. Prisma abstracts low-level SQL while preventing relational mapping drift.
5. **PostgreSQL 16**: An enterprise-grade, ACID-compliant relational database. PostgreSQL supports advanced indexing, relational integrity, JSON data, and rich query operators essential for social graph relationships (follows, favorites) and article tagging.

## Alternatives Considered
- **Fastify vs. Express**: Fastify offers higher synthetic throughput, but Express was chosen due to its ubiquitous adoption, extensive middleware ecosystem, and exact alignment with RealWorld specification implementations.
- **TypeORM / MikroORM vs. Prisma**: TypeORM and MikroORM rely heavily on experimental decorators and mutable entity states. Prisma enforces strict immutability, type safety, and clean separation between models and queries.
- **MongoDB vs. PostgreSQL**: Conduit's core domain features heavily relational constructs: many-to-many user-article favorites, user-user follow graphs, and article-tag mappings. A relational database with foreign key constraints is architecturally superior to a document store.

## Consequences
- **Positive**: Complete end-to-end type safety from database models to HTTP response serialization; declarative schema migrations; modular ports and adapters separation; robust testability.
- **Negative**: Prisma engine binaries introduce a slight cold-start overhead; TypeScript compilation step required before execution.
