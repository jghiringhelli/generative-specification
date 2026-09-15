# ADR-0001: Application Technology Stack

## Context

The Conduit service requires a stable, typed, and maintainable foundation for a
JSON HTTP API backed by a relational database. The application must support the
complete RealWorld contract while remaining straightforward to operate in local
development, continuous integration, and production. The selected stack needs
strong ecosystem support, predictable long-term maintenance, secure dependency
management, and a clear database migration workflow. It must also enable strict
compile-time checks without compromising the familiar middleware model expected
by Express applications.

## Decision

The service will use TypeScript 5 running on Node.js 20. TypeScript is configured
in strict mode and targets ES2022, giving the project modern language features
and strong static guarantees while retaining broad runtime compatibility. Node
20 is an active long-term-support runtime with mature operational tooling.

Express 4 will provide the HTTP server and routing layer. Express has a small,
well-understood API, a large middleware ecosystem, and sufficient flexibility
for thin request adapters around application services.

Prisma 5 will provide the database client, schema definition, and migration
workflow. Its generated client gives typed queries and explicit relations while
keeping persistence details in repository adapters. PostgreSQL 16 will be the
system of record because it provides transactional integrity, mature indexing,
reliable constraints, and excellent production tooling.

## Alternatives Considered

Fastify was considered for its performance and schema support, but Express was
selected because the RealWorld ecosystem and maintainers are more familiar with
its conventions. NestJS was rejected because its framework-level abstractions
and dependency injection container would add unnecessary complexity. TypeORM
and Sequelize were considered, but Prisma offers a clearer schema-first
migration experience and stronger generated types. SQLite was rejected because
its concurrency and type behavior would not faithfully represent the intended
production database. Earlier Node releases were rejected because Node 20
provides the desired LTS baseline.

## Consequences

The project receives strict static checking, a conventional HTTP adapter, typed
database access, and repeatable PostgreSQL migrations. Developers must generate
the Prisma client after schema changes and keep migrations synchronized with the
schema. Express request types require explicit boundary validation because they
do not enforce runtime types. PostgreSQL must be available for integration
tests and deployed environments. The chosen versions are intentional major
version boundaries; upgrades require dependency review and regression testing.
