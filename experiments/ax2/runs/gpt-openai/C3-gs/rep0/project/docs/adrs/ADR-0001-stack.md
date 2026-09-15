# ADR-0001: Application Stack

## Context

The Conduit service needs a predictable, maintainable HTTP stack that is well supported,
type safe, and straightforward to run in local development and continuous integration.
The service exposes a JSON API backed by relational data with non-trivial relationships
between users, follows, articles, tags, favorites, and comments. The implementation must
make invalid states visible during development while retaining a small operational
footprint. It must also support deterministic schema migrations and generated database
types so that persistence code remains aligned with the database.

## Decision

We will use TypeScript 5 on Node.js 20. Express 4 is the HTTP adapter and will remain thin:
routes validate and translate HTTP input, then delegate to application services. Prisma 5
is the persistence adapter and migration tool. PostgreSQL 16 is the system of record.
TypeScript strict mode is mandatory. Prisma's generated client provides typed database
access, while repository interfaces keep services independent of Prisma. Node 20 provides
an active LTS runtime with modern language support and stable production behavior.

## Alternatives Considered

Fastify was considered for its schema-driven validation and performance, but Express was
selected because the API is modest and its ecosystem, middleware compatibility, and
familiarity reduce delivery risk. NestJS was rejected because its framework-level
abstractions and decorators add complexity unnecessary for this service. Sequelize and
TypeORM were considered, but Prisma's schema, migration workflow, and generated types
provide a clearer contract. SQLite was rejected because its concurrency and relational
behavior differ from the intended production database. MongoDB was rejected because the
domain is naturally relational and relies on uniqueness and referential integrity.

## Consequences

The team gains compile-time checking across API, service, and persistence boundaries,
repeatable PostgreSQL migrations, and a broadly understood HTTP framework. Repository
adapters require some mapping code, but they prevent business logic from depending on an
ORM. PostgreSQL must be available for integration tests. Prisma generation becomes part
of setup and CI. Major version upgrades for Node, Express, Prisma, or PostgreSQL require
an explicit compatibility review. The resulting architecture favors clarity and
replaceable adapters over framework convenience.
