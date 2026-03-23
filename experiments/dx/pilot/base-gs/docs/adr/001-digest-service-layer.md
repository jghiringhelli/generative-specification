# ADR 001: Digest Feature Uses Service Layer

**Date:** 2026-03-17
**Status:** Accepted

## Context
The existing codebase puts Prisma calls directly in route handlers. Adding the Digest feature is an opportunity to establish a cleaner pattern.

## Decision
The Digest feature will be implemented with a service layer:
- `src/services/digest.service.ts` — business logic, accepts repository interfaces
- `src/routes/digest.ts` — thin handler, no Prisma

## Consequences
- Routes stay thin and testable without a database
- Service logic can be unit-tested in isolation
- Sets a pattern for future feature development
