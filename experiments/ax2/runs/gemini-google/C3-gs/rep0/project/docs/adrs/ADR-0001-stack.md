# ADR-0001: Core Technology Stack

## Status
Accepted

## Date
2026-09-15

## Context
The RealWorld Conduit specification defines a medium-scale publishing and social blogging platform API with strict contract requirements. We need a reliable, high-performance, strictly typed backend foundation that enables rapid feature delivery, maintainability, robust static analysis, and zero-defect data integrity. In addition, the developer toolchain and testing ecosystem must provide predictable runtime execution with modern JavaScript and ECMAScript standard support.

To satisfy these architectural requirements, we require an established runtime environment paired with a strongly typed language, an battle-tested HTTP routing framework, an ergonomic yet type-safe Object-Relational Mapping (ORM) solution, and an enterprise-grade relational database engine.

## Decision
We select the following core stack for the RealWorld Conduit backend implementation:
1. **Node.js 20 LTS**: Modern, stable runtime providing native performance improvements, long-term support, and excellent ecosystem compatibility.
2. **TypeScript 5**: Provides advanced type inference, compile-time contract enforcement, interface segregation, and strict null checking to prevent runtime exceptions.
3. **Express 4**: The foundational, lightweight HTTP web framework for Node.js, providing minimal overhead, transparent middleware composition, and predictable request lifecycle handling.
4. **Prisma 5**: A next-generation type-safe ORM that generates fully typed query clients directly from a declarative schema, eliminating object-relational impedance mismatches and preventing SQL injection vulnerabilities.
5. **PostgreSQL 16**: An enterprise-grade, ACID-compliant relational database management system offering rich indexing capabilities, relational integrity constraints, and reliable JSON/array operations.

## Alternatives Considered
- **NestJS vs. Express 4**: NestJS offers modular structure and dependency injection decorators out-of-the-box, but introduces steep learning curves, heavy reflection metadata overhead, and framework lock-in. Express 4 was chosen for its architectural simplicity, unopinionated design, and direct composability with Clean Architecture boundaries.
- **TypeORM / Drizzle vs. Prisma 5**: TypeORM suffers from maintenance issues and weak type inference in complex joins. Drizzle is lightweight but requires manual migration coordination. Prisma 5 provides a single declarative source of truth, automated migrations, and end-to-end type safety.
- **MongoDB vs. PostgreSQL 16**: Document stores lack foreign key constraints and transactional guarantees essential for multi-entity relationships such as followers, article tags, comments, and favorites. PostgreSQL 16 provides strict referential integrity.

## Consequences
- **Positive**: Strict compile-time validation eliminates type mismatches across controllers, services, and repositories. Prisma ensures schema migrations and queries remain synchronized with domain models.
- **Negative**: Prisma schema changes require migration steps before deployment. Native TypeScript compilation adds a build step (`tsc`) in the CI/CD pipeline.
