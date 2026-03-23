# ADR 001: Service-Repository Pattern for All Features

**Date:** 2026-03-17
**Status:** Accepted

## Context
The existing codebase has direct Prisma calls in route handlers. This creates:
- Untestable routes (database dependency in handler)
- Duplicated query logic
- No separation of business rules from persistence

## Decision
All new and refactored features use:
- Repository layer: all Prisma queries
- Service layer: business logic, calls repositories
- Route layer: auth, request parsing, response shaping only

## Consequences
- Routes can be unit-tested with mocked services
- Business logic is database-agnostic
- Consistent pattern across all features
