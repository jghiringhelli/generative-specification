
# ADR-0001: Technology Stack Selection

**Date:** 2026-03-14  
**Status:** Accepted  
**Deciders:** Experiment team  
**Tags:** infrastructure, backend, database

## Context

The Conduit API is a Medium.com clone implementing the RealWorld specification, which defines approximately 15 REST endpoints covering user authentication, article management, social features (follows, favorites), commenting, and tagging. The implementation must handle relational data patterns including many-to-many relationships (user follows, article favorites, article tags) and hierarchical data (articles with nested author profiles and comments).

This project serves as a controlled experiment comparing architectural approaches to AI-assisted code generation. The technology stack must be:
1. **Type-safe** to enable compile-time verification of contracts between layers
2. **Well-documented** to minimize ambiguity in AI-generated code
3. **Widely adopted** to maximize comparability with existing RealWorld reference implementations
4. **Suitable for relational data** given the inherent graph structure of social features

The stack choice directly impacts the experiment's validity — an obscure or bleeding-edge stack would introduce confounding variables, while an overly simplistic stack might not adequately test architectural separation principles.

## Decision

We adopt **TypeScript 5 + Node.js 20+ + Express 4 + Prisma 5 + PostgreSQL 16** as the core technology stack.

**Rationale by component:**

- **TypeScript 5**: Provides structural typing with strict mode enabled, interfaces for repository contracts, and compile-time enforcement of the layered architecture. The `strict` flag catches type mismatches that would otherwise surface as runtime errors.

- **Node.js 20 LTS**: Current long-term support release with native fetch, improved performance, and security updates. ES2022 features (top-level await, private class fields) enable cleaner async code patterns.

- **Express 4**: Minimalist HTTP framework with established middleware ecosystem. Unlike NestJS (decorator-heavy, opinionated DI) or Fastify (fewer reference implementations), Express provides sufficient structure without imposing architectural patterns that would obscure the experiment's architectural contributions.

- **Prisma 5**: Type-safe ORM with schema-first approach. Generates TypeScript client from `schema.prisma`, ensuring compile-time verification of all database operations. Migration system (`prisma migrate`) provides version-controlled schema evolution. Prisma's query builder prevents SQL injection by design.

- **PostgreSQL 16**: ACID-compliant relational database with robust support for foreign keys, constraints, and complex queries (e.g., feed generation requires joining through the UserFollow table). JSON support enables flexible tag storage if needed.

**Stack integration benefits:**
- Prisma's generated types flow directly into repository return types
- TypeScript interfaces define repository contracts that services depend on
- Express middleware can be typed with generic request/response extensions
- Jest (natural test runner for this stack) provides TypeScript integration via ts-jest

## Alternatives Considered

| Alternative | Reason for Rejection |
|-------------|---------------------|
| **NestJS** | Decorator-based dependency injection and module system imposes architectural patterns that would confound the experiment. We need to explicitly demonstrate layered architecture through manual dependency injection, not framework magic. |
| **Fastify** | Faster than Express, but fewer RealWorld reference implementations exist. Comparability with the broader ecosystem is critical for experiment validity. |
| **Hono** | Modern and performant, but ecosystem maturity is lower. Limited community examples for complex authentication patterns. |
| **Raw node:http** | Eliminates framework abstraction but increases boilerplate 10x (manual routing, body parsing, error handling). Not representative of real-world development practices. |
| **Raw SQL (node-postgres)** | Rejects Prisma's type safety, forcing manual query construction and result mapping. Increases accidental complexity (SQL strings, type conversions) without any architectural benefit for this experiment. |
| **MongoDB** | RealWorld's data model is inherently relational: user follows form a directed graph, favorites are a many-to-many join, comments reference articles with cascade deletion. Forcing this into a document model adds mapping complexity and denormalization challenges without domain benefit. |
| **Drizzle ORM** | Type-safe and modern, but fewer RealWorld reference implementations. Prisma has superior documentation and community adoption for AI-assisted development scenarios. |
| **bcrypt for password hashing** | Requires native compilation (node-gyp) and has a documented CVE chain through `@mapbox/node-pre-gyp → tar` dependency. argon2 is pure JavaScript, OWASP-recommended, and has no known dependency vulnerabilities. |

## Consequences

### Positive
- **Type safety**: `tsc --noEmit` catches layer boundary violations at compile time. If a route handler directly calls Prisma instead of a repository, the type mismatch is detected before runtime.
- **Refactoring confidence**: Repository interface changes immediately surface as type errors in all consuming services.
- **AI agent compatibility**: TypeScript's explicit interfaces provide clear contracts that AI code generators can target. Express's middleware patterns are well-documented in training data.
- **Ecosystem maturity**: 100+ RealWorld reference implementations exist across this stack family, providing ground truth for expected patterns.
- **Test infrastructure**: Jest + Supertest is the canonical testing approach for Express APIs. ts-jest provides seamless TypeScript integration.
- **Security defaults**: Prisma parameterizes all queries, argon2 prevents timing attacks, JWT validation via `jsonwebtoken` is well-audited.

### Negative
- **Express boilerplate**: Middleware chains require explicit composition. Unlike NestJS, there's no built-in dependency injection — we must implement a composition root manually.
- **Prisma client generation**: Schema changes require running `prisma generate` before TypeScript compilation. CI pipelines must include this step.
- **ORM limitations**: Prisma's query builder cannot express every SQL query pattern efficiently. Complex aggregations (e.g., "articles favorited by users I follow") may require raw SQL with `$queryRaw`.
- **Migration discipline**: Deployed migrations are immutable. Errors require writing a new "up" migration, not editing the broken one.

### Risks and Mitigations
- **Risk**: Prisma schema drift from application code expectations  
  **Mitigation**: Prisma client types are generated; TypeScript enforces alignment. Schema must be source of truth.

- **Risk**: Express route handlers bloating with business logic  
  **Mitigation**: CLAUDE.md explicitly prohibits `prisma.*` calls from route files. Verification Protocol §1 enforces this.

- **Risk**: JWT secret leakage  
  **Mitigation**: Zero tolerance for hardcoded secrets. All config via environment variables. Pre-commit hook scans for secrets.

## References
- RealWorld spec: https://docs.realworld.show/specifications/backend
- Prisma best practices: https://www.prisma.io/docs/guides/performance-and-optimization
- Express security: https://expressjs.com/en/advanced/best-practice-security.html
- OWASP password storage: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
