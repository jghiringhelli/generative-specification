# ADR-0001: Core Technology Stack Selection

## Status
Accepted

## Context
The RealWorld Conduit application requires a resilient, maintainable, type-safe, and high-performance backend capable of fulfilling the complete RealWorld specification. The specification mandates a clean RESTful JSON API handling authentication, user profiles, article publishing with rich tag taxonomies, comments, social follow graphs, and favorites. We need an architectural foundation that supports rapid iterative delivery while guaranteeing structural correctness, strict compile-time type safety, modular layered architecture, and seamless database migrations.

## Decision
We select the following core technology stack:
- **Language**: TypeScript 5 with strict mode enabled (`strict: true`, ES2022 target). TypeScript provides static typing, reducing runtime bugs and enabling deterministic refactoring across domain layers.
- **Runtime**: Node.js 20 LTS. Node 20 delivers stable long-term support, high event-loop performance, and native modern ECMAScript capabilities.
- **Web Framework**: Express 4. Express is the industry-standard, lightweight HTTP framework with battle-tested middleware ecosystems, minimal overhead, and predictable lifecycle management.
- **Object-Relational Mapping (ORM)**: Prisma 5. Prisma offers declarative schema management, automatic type generation, robust connection pooling, and strict relational data modeling.
- **Persistence Engine**: PostgreSQL 16. PostgreSQL provides ACID compliance, strong relational integrity, index versatility (B-Tree, GIN), and native text search support.

## Alternatives Considered
- **NestJS vs. Express 4**: NestJS provides an opinionated modular framework out-of-the-box, but introduces heavy dependency on experimental decorators and reflection metadata, increasing bundle size and runtime indirection. Express 4 allows explicit Hexagonal / Ports-and-Adapters composition with zero framework lock-in.
- **TypeORM / Drizzle vs. Prisma 5**: TypeORM suffers from complex Active Record / Data Mapper edge cases and schema drift. Drizzle provides excellent SQL-like query builder ergonomics, but Prisma's single source of truth schema file and automatic client generation provide superior developer ergonomics and schema migrations for the Conduit specification.
- **MongoDB vs. PostgreSQL**: Conduit's domain entities (users, follows, articles, tags, favorites, comments) are inherently relational with foreign key constraints. A relational engine prevents orphaned references and ensures referential integrity at the database layer.

## Consequences
- **Positive**: Strict type safety flows from database schema through Prisma Client to repository interfaces and API request handlers. Transparent database migrations ensure consistent development and production schemas.
- **Negative**: Prisma Client requires a code generation step (`prisma generate`) following schema edits. Express requires manual dependency injection and wiring compared to full-featured opinionated frameworks.
