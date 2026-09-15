# ADR-0001: Application Technology Stack

## Context

The Conduit backend must expose a predictable HTTP JSON API while remaining maintainable, type-safe, and deployable in a conventional server environment. The application includes authentication, relational data, transactional updates, and several many-to-many relationships. It therefore needs a mature web framework, a strongly typed implementation language, a supported runtime, a relational database, and a database access layer that makes schema evolution explicit. The selected components must also have stable ecosystems, good automated-testing support, and clear production operating characteristics. The team requires strict compile-time checking without sacrificing access to the Node.js package ecosystem.

## Decision

The service will use TypeScript 5 on Node.js 20. TypeScript will run in strict mode and compile to ES2022. Express 4 will be the HTTP framework because its small request-handling core keeps transport concerns separate from application services and has broad middleware support. Prisma 5 will provide schema definition, generated database types, migrations, and PostgreSQL access. PostgreSQL 16 will be the system of record because the domain is relational and requires uniqueness constraints, joins, transactions, and reliable referential integrity. Application services will depend on repository interfaces rather than Prisma directly, preserving the boundary between business logic and persistence.

## Alternatives Considered

Fastify was considered for stronger built-in schema support and high throughput, but Express has a larger support base and is sufficient for this workload. NestJS was rejected because its framework conventions and dependency-injection container add unnecessary complexity for this focused API. Sequelize and TypeORM were considered, but Prisma's generated client and declarative migrations provide a clearer type-safe workflow. MongoDB was rejected because follows, favorites, authorship, tags, and comments form a naturally relational model that benefits from database constraints. Earlier Node.js releases were rejected in favor of the active long-term-support baseline provided by Node 20.

## Consequences

The stack is familiar, well documented, and supported by common hosting platforms. Strict TypeScript catches boundary and nullability errors before deployment. Prisma migrations make database changes reviewable and reproducible, while PostgreSQL enforces core invariants. Repository abstractions introduce mapping code, and Prisma adds a generation step to builds. Express requires the project to define its own validation and error-handling conventions. Node 20 and PostgreSQL 16 become explicit deployment requirements. These costs are accepted in exchange for a simple architecture, strong typing, durable relational storage, and low operational risk.
