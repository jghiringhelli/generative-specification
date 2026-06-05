# ADR-0001: Technology Stack

- **Status**: Accepted
- **Date**: 2026-06-04
- **Deciders**: Architecture Sentinel
- **Supersedes**: —

## Context

The project must implement the RealWorld "Conduit" REST API: a Medium-style
backend with JWT authentication, articles, comments, user profiles, favorites,
and tags, conforming exactly to the published RealWorld API specification. The
non-functional constraints from the constitution and standards are strict: a
strongly typed language with no `any`, a layered ports-and-adapters
architecture, ≥80% line coverage plus a mutation-score gate, acyclic module
dependencies, and a persistence layer with first-class migration support. The
team needs a stack that is mainstream enough to be well understood by both human
and AI contributors, has a mature security and tooling ecosystem, and supports
the conformance test suite that drives "done".

## Decision

We adopt the following stack:

- **Language**: TypeScript 5 (`^5.4`+) compiled to ES2022, with `strict: true`
  and `noUncheckedIndexedAccess: true`. Static types give us interface-first
  design (ports as `interface`s), compile-time enforcement of layer contracts,
  and safe refactoring.
- **Runtime**: Node.js 20 LTS. Node 16/18 are EOL and excluded. ESM modules
  (`"type": "module"`, NodeNext resolution) with `.js` import extensions on all
  local imports.
- **Web framework**: Express 4. Minimal, ubiquitous, unopinionated — it maps
  cleanly onto thin driving adapters (routes) that validate and delegate to
  services. Express 5 is still stabilising and not adopted here.
- **ORM / persistence**: Prisma 5 over **PostgreSQL 16**. Prisma provides a
  typed client (aligning with our no-`any` rule), a declarative schema, and a
  migration workflow (`prisma migrate`) that the CI pipeline runs as a gate.
- **Validation**: Zod for request/response DTO validation at layer boundaries.
- **Testing**: Jest 29 with ts-jest (ESM), Supertest for subcutaneous API
  tests, and Stryker for the mutation gate.

## Alternatives Considered

- **Fastify instead of Express**: faster and schema-first, but Express has
  broader documentation and a larger middleware ecosystem, lowering risk for a
  spec-conformance project. Performance is not a stated success criterion.
- **NestJS**: provides DI and structure out of the box, but its heavy decorator
  framework would couple our domain to the framework, violating the "domain has
  zero external dependencies" invariant. We prefer hand-wired composition.
- **TypeORM / Knex instead of Prisma**: TypeORM's active-record patterns leak
  persistence into the domain; raw Knex lacks type safety. Prisma's generated
  client and migration tooling fit our gates better.
- **Plain JavaScript**: rejected outright — incompatible with interface-first,
  no-`any`, typed-port requirements.
- **MySQL / SQLite for production**: PostgreSQL 16 is chosen for relational
  integrity, rich indexing, and parity between local, staging, and production.

## Consequences

**Positive**: end-to-end type safety from HTTP boundary to database; migrations
and dependency audits are enforceable CI gates; the stack is widely understood,
reducing onboarding cost. **Negative / trade-offs**: ESM + ts-jest requires
care (NodeNext `.js` extensions, `--experimental-vm-modules` for Jest); Prisma's
generated client must be regenerated in CI before typecheck; certain CommonJS
packages (e.g. `jsonwebtoken`) require default-import interop rather than named
imports. These costs are accepted and documented in the relevant configs and in
ADR-0002.
