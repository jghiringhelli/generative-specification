# ADR-0001: Application Technology Stack

## Context

The Conduit backend requires a maintainable HTTP API, strong static analysis, a
predictable runtime, and a relational persistence layer capable of expressing
users, follows, articles, favorites, comments, and tags. The implementation must
support local development and automated CI while remaining familiar to
contributors in the JavaScript ecosystem. It must also provide explicit schema
migrations and generated, type-safe database access so that application and
database contracts evolve together.

## Decision

We will use TypeScript 5 on Node.js 20. TypeScript's strict mode is mandatory to
detect nullability, contract, and refactoring errors before deployment. Node.js
20 is an active long-term-support runtime with modern language and platform
features.

Express 4 will provide the HTTP adapter. It has a small API surface, broad
middleware support, and stable production behavior. Application services will
remain independent from Express request and response objects.

Prisma 5 will implement the repository adapters and manage schema migrations.
Its generated client gives compile-time feedback for database queries and its
migration workflow provides auditable database changes. PostgreSQL 16 will be
the relational database because the Conduit data model depends on constraints,
transactions, joins, and reliable indexing. PostgreSQL also provides mature
operational tooling and consistent behavior across development, CI, staging,
and production.

## Alternatives Considered

JavaScript without TypeScript was rejected because it moves contract failures
to runtime. Fastify and NestJS were considered; Fastify offers performance and
NestJS offers extensive structure, but both add concepts unnecessary for this
API. Sequelize and TypeORM were considered, but Prisma's generated types and
migration ergonomics better fit the project. MongoDB was rejected because the
domain relationships and uniqueness rules are naturally relational. Older
Node.js and PostgreSQL versions were rejected to avoid beginning the project on
shorter-lived or obsolete platforms.

## Consequences

Developers need Node.js 20 and PostgreSQL 16-compatible infrastructure.
Database changes must be represented as Prisma migrations. Generated Prisma
types become part of the build workflow. Strict TypeScript may require more
explicit boundary validation, but that cost produces clearer contracts and
safer changes. Express handlers must stay thin so framework concerns do not
leak into domain and service code. The selected versions establish a stable,
well-supported baseline while preserving the ability to replace adapters
without rewriting business rules.
