# ADR-003: Layered Architecture

**Date:** 2026-03-11
**Status:** Accepted

## Context

Need to enforce separation of concerns to produce a maintainable, testable codebase. The primary goal is to prevent direct database access from route handlers — the most common drift pattern in AI-generated Express APIs.

## Decision

Four-layer architecture with strict downward-only dependency direction:

```
Routes (Express handlers)     ← Thin. Parse input, call service, format response.
       ↓
Services (Business Logic)     ← Orchestrate. Depend on repository interfaces only.
       ↓
Repositories (Data Access)    ← Single responsibility: translate domain operations to DB calls.
       ↓
Database (Prisma/PostgreSQL)  ← Persistence layer. Never referenced above the repository.
```

## Alternatives Considered

| Option | Rejected Reason |
|---|---|
| Fat routes (all logic in handlers) | Untestable — handlers combine HTTP, business, and persistence concerns |
| Service + direct Prisma | Services coupled to ORM — hard to test without DB, hard to swap ORM |
| Repository without interfaces | Tight coupling — services cannot be unit-tested with mocks |

## Consequences

- Route handlers have one job: parse HTTP, call service method, return response
- Services can be unit-tested by injecting mock repositories
- Repositories can be swapped (in-memory for tests, Prisma for production)
- An agent generating a route handler will NOT place a `prisma.xxx` call there — the CLAUDE.md rule closes that surface

## Enforcement

This decision is enforced by CLAUDE.md rule: "No direct Prisma calls from route handlers."
Violation detectable by: `grep -r "prisma\." src/routes/`
