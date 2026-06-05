# project — Core

> Always loaded. Contains only what is true across all domains.
> Hard limit: 50 lines. If it grows, move the excess to a domain node.

## Domain Identity
Conduit is a social blogging platform (Medium.com clone). The API is a REST JSON API with JWT-based authentication.  **Stack target (both conditions):** TypeScript, Node.js, Express, Prisma, Postgre

## Tags
[UNIVERSAL] [API]

## Primary Entities
- <!-- FILL: list primary entities here -->

## Layer Map
```
[Routes] → [Services] → [Domain] → [Repositories] → [Adapters]
Dependencies point inward. Domain has zero external imports.
```

## Folder Structure
```
src/routes/       — handlers (thin: auth + validate + delegate)
src/services/     — business logic (interfaces only)
src/domain/       — pure domain models
src/repositories/ — data access
src/adapters/     — external APIs, infrastructure
tests/            — mirrors src/ structure
docs/             — PRD, use-cases, architecture, ADRs
.claude/          — core.md, index.md, standards/, hooks/
```

## Invariants
- Every public function has a JSDoc with typed params and returns
- No circular imports (enforced by pre-commit hook)
- Test coverage ≥80% on all changed files