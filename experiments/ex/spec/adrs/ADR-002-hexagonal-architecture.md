# ADR-002: Hexagonal Architecture (Ports & Adapters)

**Status:** Accepted  
**Date:** 2026-04-17

## Context

The RealWorld spec requires clean separation between HTTP concerns and domain logic to enable testability and future adapter swaps (e.g. replacing Prisma with a different ORM, or adding a CLI).

## Decision

Strict three-layer hexagonal architecture: Routes (driving adapters) → Services (domain) → Repositories (driven adapters). Each layer communicates only with its adjacent layer via interfaces.

## Consequences

- **Positive**: Services are unit-testable without HTTP or DB. Repositories are swappable.
- **Positive**: Error types are domain-owned — no HTTP status codes inside services.
- **Constraint**: Routes must never call `prisma` directly. Services must never import `express`. Violations are caught by code review.
- **Constraint**: DTOs required at every layer boundary — no leaking Prisma types into service responses.
