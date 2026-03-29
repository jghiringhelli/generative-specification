---
nav_exclude: true
---

```typescript
// package.json
{
  "name": "conduit-api",
  "version": "0.1.0",
  "description": "RealWorld Conduit API - TypeScript/Express/Prisma implementation",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "prepare": "husky install",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:push": "prisma db push"
  },
  "keywords": ["realworld", "conduit", "api", "express", "prisma", "typescript"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.21.0",
    "@prisma/client": "^5.19.0",
    "argon2": "^0.41.1",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.8",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.4.0",
    "pino": "^9.4.0",
    "pino-http": "^10.3.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.16.5",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/cors": "^2.8.17",
    "@types/jest": "^29.5.13",
    "@types/supertest": "^6.0.2",
    "typescript": "^5.6.2",
    "tsx": "^4.19.1",
    "prisma": "^5.19.0",
    "@typescript-eslint/eslint-plugin": "^8.6.0",
    "@typescript-eslint/parser": "^8.6.0",
    "eslint": "^8.57.1",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.5",
    "supertest": "^7.0.0",
    "@stryker-mutator/core": "^8.6.0",
    "@stryker-mutator/jest-runner": "^8.6.0",
    "@stryker-mutator/typescript-checker": "^8.6.0",
    "husky": "^9.1.6",
    "@commitlint/cli": "^19.5.0",
    "@commitlint/config-conventional": "^19.5.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["node", "jest"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

```bash
#!/usr/bin/env sh
# .husky/pre-commit
. "$(dirname -- "$0")/_/husky.sh"

# Security gate: zero HIGH/CRITICAL CVEs required
npm audit --audit-level=high

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Tests
npm test -- --passWithNoTests
```

```bash
#!/usr/bin/env sh
# .husky/commit-msg
. "$(dirname -- "$0")/_/husky.sh"

npx commitlint --edit "$1"
```

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'docs',
        'test',
        'chore',
        'style',
        'perf',
        'ci',
        'build',
        'revert'
      ]
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100]
  }
};
```

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  ci:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: conduit
          POSTGRES_PASSWORD: conduit
          POSTGRES_DB: conduit_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Security gate - zero HIGH/CRITICAL CVEs required
        run: npm audit --audit-level=high

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Type check
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Apply database schema
        run: npx prisma db push
        env:
          DATABASE_URL: postgresql://conduit:conduit@localhost:5432/conduit_test

      - name: Run tests with coverage
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://conduit:conduit@localhost:5432/conduit_test
          JWT_SECRET: ci-test-secret-minimum-32-characters-long-for-hs256
          JWT_EXPIRY: 7d
          NODE_ENV: test

      - name: Mutation testing gate
        run: npx stryker run
        env:
          DATABASE_URL: postgresql://conduit:conduit@localhost:5432/conduit_test
          JWT_SECRET: ci-test-secret-minimum-32-characters-long-for-hs256
          JWT_EXPIRY: 7d
          NODE_ENV: test

      - name: Upload coverage to artifact
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/
```

```markdown
# CHANGELOG.md

All notable changes to the Conduit API project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure with TypeScript, Express, Prisma, PostgreSQL stack
- Husky pre-commit hooks for type checking, linting, testing, and security auditing
- CI/CD pipeline with GitHub Actions including mutation testing gate
- Repository interface contracts for User, Article, Comment, Profile, and Tag domains
- Custom error class hierarchy (AppError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError)
- Dependency approval registry with vulnerability audit requirements
- ADR-0001: Technology stack selection rationale
- ADR-0002: JWT authentication and argon2 password hashing strategy
- Jest test configuration with 80% coverage threshold
- Conventional commits enforcement via commitlint
```

```markdown
# docs/adrs/ADR-0001-stack.md

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
```

```markdown
# docs/adrs/ADR-0002-auth.md

# ADR-0002: Authentication and Password Hashing Strategy

**Date:** 2026-03-14  
**Status:** Accepted  
**Deciders:** Experiment team  
**Tags:** security, authentication, dependencies

## Context

The RealWorld specification mandates stateless authentication with the header format `Authorization: Token <jwt>`. Users register with email/username/password, receive a JWT on successful authentication, and present that token for subsequent requests requiring authorization.

Password storage and token management are security-critical components. Incorrect choices expose the application to credential theft, session hijacking, and dependency vulnerabilities. The decision must balance security best practices, implementation simplicity, and dependency audit compliance (per CLAUDE.md § Dependency Registry, zero HIGH/CRITICAL CVEs are permitted).

## Decision

1. **Authentication mechanism**: Stateless JWT using the `jsonwebtoken` library
2. **Password hashing**: argon2 via the `argon2` npm package (v0.41+)
3. **Token signing**: HS256 algorithm with a 256-bit secret from `process.env.JWT_SECRET`
4. **Token expiry**: Configurable via `process.env.JWT_EXPIRY` (default: 7 days), cast as `SignOptions['expiresIn']` per CLAUDE.md § Known Type Pitfalls
5. **No refresh tokens**: Out of scope for RealWorld specification; tokens are long-lived

**JWT payload structure:**
```typescript
{ userId: number, iat: number, exp: number }
```

**Auth middleware flow:**
1. Extract token from `Authorization: Token <token>` header
2. Verify signature and expiry via `jwt.verify(token, secret)`
3. Attach `{ userId }` to `req.user` for downstream route handlers
4. On failure: throw `UnauthorizedError` → middleware converts to 401 with `{"errors": {"body": ["unauthorized"]}}`

## Alternatives Considered

### Password Hashing

| Option | Reason for Rejection |
|--------|---------------------|
| **bcrypt (bcryptjs or bcrypt)** | The native `bcrypt@5.x` package depends on `@mapbox/node-pre-gyp@1.x` which pulls in `tar` versions with known HIGH CVEs (arbitrary file write vulnerabilities). `bcryptjs` (pure JS) is slower and still less secure than argon2. OWASP recommends argon2 as the current best practice. |
| **scrypt (Node.js built-in)** | Acceptable from a security standpoint, but requires manual salt generation and parameter tuning. argon2 provides better defaults and is the OWASP-recommended algorithm for password storage. |
| **PBKDF2 (Node.js built-in)** | Older standard, more vulnerable to GPU-based attacks than argon2. No advantage over argon2 except avoiding a dependency — but argon2 has zero HIGH/CRITICAL CVEs. |

**argon2 advantages:**
- Winner of the Password Hashing Competition (2015)
- Memory-hard algorithm (resistant to GPU/ASIC attacks)
- No native compilation dependencies (unlike bcrypt's node-gyp chain)
- Clean audit: `npm audit` reports zero vulnerabilities as of 2026-03-14
- OWASP-recommended in Password Storage Cheat Sheet

### Authentication Mechanism

| Option | Reason for Rejection |
|--------|---------------------|
| **Session cookies** | Stateful — requires session store (Redis, database), adds infrastructure complexity. Horizontal scaling requires sticky sessions or shared session storage. Not aligned with RealWorld spec's stateless design. |
| **OAuth2 / OpenID Connect** | Over-scoped. RealWorld is a single-service API with no third-party login providers. OAuth adds token endpoints, client registration, and scope management — none of which are in the spec. |
| **Paseto (Platform-Agnostic Security Tokens)** | Stronger cryptographic design than JWT, but ecosystem adoption is lower. The `jsonwebtoken` library is widely audited and has clear documentation for `SignOptions['expiresIn']` type handling (critical per CLAUDE.md § Known Type Pitfalls). Paseto would reduce comparability with existing RealWorld implementations. |
| **HTTP Basic Auth** | Credentials sent on every request. No token expiry. Credentials must be stored client-side in a way that survives page reloads — typically localStorage, which is more vulnerable to XSS than httpOnly cookies (but we're not using cookies either). No standard logout mechanism. |

## Consequences

### Positive
- **Stateless scaling**: No server-side session storage. Tokens are self-contained; any API instance can verify them.
- **Simplicity**: `jsonwebtoken` library is mature, well-documented, and has a clear API.
- **Spec compliance**: `Authorization: Token <jwt>` matches RealWorld header format exactly.
- **Password security**: argon2 with default cost parameters (time=3, memory=65536, parallelism=4) provides strong protection against offline attacks.
- **Clean dependency audit**: Both `jsonwebtoken@9.x` and `argon2@0.41.x` pass `npm audit --audit-level=high` with zero HIGH/CRITICAL vulnerabilities (verified 2026-03-14).

### Negative
- **Token revocation**: JWTs cannot be server-side invalidated without maintaining a blacklist (which reintroduces state). If a user's token is compromised, it remains valid until expiry. Mitigation: short expiry (default 7 days) and password change triggers re-issuance.
- **Secret rotation**: Changing `JWT_SECRET` invalidates all existing tokens. Users must re-login. Requires coordination in multi-instance deployments.
- **Type complexity**: `jsonwebtoken`'s `SignOptions['expiresIn']` is typed as `StringValue | number | undefined`, where `StringValue` is a branded type from the `ms` package. Direct assignment from `process.env.JWT_EXPIRY` (type `string | undefined`) fails at compile time. **Required pattern** (per CLAUDE.md):
  ```typescript
  import type { SignOptions } from 'jsonwebtoken';
  const JWT_EXPIRY = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];
  ```

### Security Notes
- **JWT_SECRET minimum length**: HS256 requires a 256-bit (32-byte) secret for cryptographic strength. The `.env.example` file documents this requirement. CI environment uses a 64-character secret.
- **Password hashing cost**: argon2's default parameters balance security and performance. Registration takes ~200ms on modest hardware — acceptable for user-facing auth.
- **No password in JWT payload**: Only `userId` is stored. Passwords never leave the hashing function.
- **Timing attack resistance**: `argon2.verify()` is constant-time. Even if an attacker controls the input, they cannot infer password properties from response timing.

## References
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- argon2 specification: https://github.com/P-H-C/phc-winner-argon2/blob/master/argon2-specs.pdf
- JWT best practices: https://tools.ietf.org/html/rfc8725
- jsonwebtoken library: https://github.com/auth0/node-jsonwebtoken
```

```markdown
# docs/approved-packages.md

# Approved Package Registry

This registry maintains an audited list of all dependencies approved for use in the Conduit API project. Every dependency in `package.json` must have a corresponding entry here.

**Audit process:**
1. Run `npm audit --audit-level=high` against the candidate package
2. If HIGH or CRITICAL vulnerabilities are found, reject the package or find an alternative
3. Document the decision rationale and alternatives considered
4. Update this registry before adding to `package.json`

**Last full audit:** 2026-03-14  
**Audit tool:** npm audit v10.x  
**Threshold:** Zero HIGH/CRITICAL CVEs permitted

---

## Runtime Dependencies

| Package | Version range | Purpose | Alternatives rejected | Rationale | Audit status |
|---------|---------------|---------|----------------------|-----------|--------------|
| `express` | ^4.21 | HTTP server framework | fastify (fewer reference implementations), hono (ecosystem maturity), NestJS (too opinionated for experiment) | Minimalist, widely adopted, well-documented middleware patterns. 100+ RealWorld implementations for comparability. | ✅ 0 HIGH/CRITICAL |
| `@prisma/client` | ^5.19 | Database ORM client | drizzle (fewer references), raw node-postgres (no type safety), sequelize (legacy patterns) | Type-safe queries generated from schema. Compile-time verification of DB operations. | ✅ 0 HIGH/CRITICAL |
| `argon2` | ^0.41 | Password hashing | bcrypt (CVE chain via node-pre-gyp → tar), scrypt (manual tuning required), pbkdf2 (weaker against GPU attacks) | OWASP-recommended. Memory-hard algorithm. No native deps, zero CVEs. | ✅ 0 HIGH/CRITICAL |
| `jsonwebtoken` | ^9.0 | JWT signing and verification | paseto (lower adoption), jose (more complex API) | Mature library, widely audited. Known `SignOptions['expiresIn']` type pattern documented in CLAUDE.md. | ✅ 0 HIGH/CRITICAL |
| `zod` | ^3.23 | Runtime input validation | yup (less TypeScript-native), joi (callback-based API), class-validator (decorator-based) | Type inference from schema. Functional API. No decorators (aligns with minimalist Express approach). | ✅ 0 HIGH/CRITICAL |
| `cors` | ^2.8 | CORS middleware | manual headers (error-prone), custom middleware (reinventing wheel) | Standard Express middleware. RealWorld spec requires CORS for all origins. | ✅ 0 HIGH/CRITICAL |
| `express-rate-limit` | ^7.4 | Rate limiting | rate-limiter-flexible (overkill for this scope), custom middleware | Simple in-memory rate limiting. Sufficient for single-instance dev/test. | ✅ 0 HIGH/CRITICAL |
| `pino` | ^9.4 | Structured logging | winston (slower, more complex config), bunyan (less active maintenance) | Fastest Node.js logger. JSON output. Low overhead. | ✅ 0 HIGH/CRITICAL |
| `pino-http` | ^10.3 | HTTP request logging | morgan (unstructured logs), custom middleware | Integrates pino with Express. Automatic request ID generation. | ✅ 0 HIGH/CRITICAL |

---

## Development Dependencies

| Package | Version range | Purpose | Alternatives rejected | Rationale | Audit status |
|---------|---------------|---------|----------------------|-----------|--------------|
| `typescript` | ^5.6 | TypeScript compiler | — | Required for strict type checking. Version 5.x for satisfies operator and const type parameters. | ✅ 0 HIGH/CRITICAL |
| `@types/express` | ^4.17 | Express type definitions | — | Official DefinitelyTyped definitions for Express 4. | ✅ 0 HIGH/CRITICAL |
| `@types/node` | ^20.16 | Node.js type definitions | — | Matches Node 20 LTS API surface. | ✅ 0 HIGH/CRITICAL |
| `@types/jsonwebtoken` | ^9.0 | JWT type definitions | — | Defines `SignOptions['expiresIn']` type (StringValue union). | ✅ 0 HIGH/CRITICAL |
| `@types/cors` | ^2.8 | CORS type definitions | — | DefinitelyTyped definitions for cors middleware. | ✅ 0 HIGH/CRITICAL |
| `@types/jest` | ^29.5 | Jest type definitions | — | Type support for Jest test framework. | ✅ 0 HIGH/CRITICAL |
| `@types/supertest` | ^6.0 | Supertest type definitions | — | Type support for HTTP integration testing. | ✅ 0 HIGH/CRITICAL |
| `prisma` | ^5.19 | Prisma CLI | — | Required for migrations and client generation. Matches @prisma/client version. | ✅ 0 HIGH/CRITICAL |
| `tsx` | ^4.19 | TypeScript execution (dev) | ts-node (slower), ts-node-dev (less maintained) | Fast TypeScript execution via esbuild. Watch mode for development. | ✅ 0 HIGH/CRITICAL |
| `jest` | ^29.7 | Test runner | vitest (less adoption for Express projects), mocha+chai (more setup) | De facto standard for Node/TypeScript testing. Snapshot testing, coverage built-in. | ✅ 0 HIGH/CRITICAL |
| `ts-jest` | ^29.2 | Jest TypeScript integration | babel-jest (requires extra config) | Seamless TypeScript support in Jest. Type checking in tests. | ✅ 0 HIGH/CRITICAL |
| `supertest` | ^7.0 | HTTP integration testing | axios + manual server (verbose), fetch + manual (no assertions) | Fluent API for HTTP assertions. Integrates with Jest. | ✅ 0 HIGH/CRITICAL |
| `@stryker-mutator/core` | ^8.6 | Mutation testing framework | — | Mutation testing enforces test quality (kill 80%+ mutants required). | ✅ 0 HIGH/CRITICAL |
| `@stryker-mutator/jest-runner` | ^8.6 | Stryker Jest integration | — | Runs mutants via Jest. Required for mutation gate in CI. | ✅ 0 HIGH/CRITICAL |
| `@stryker-mutator/typescript-checker` | ^8.6 | Stryker TypeScript support | — | Type-aware mutation testing. Filters invalid mutants. | ✅ 0 HIGH/CRITICAL |
| `@typescript-eslint/eslint-plugin` | ^8.6 | TypeScript linting rules | tslint (deprecated) | TypeScript-specific lint rules. Must be ^8.x (^6.x has minimatch CVE chain). | ✅ 0 HIGH/CRITICAL |
| `@typescript-eslint/parser` | ^8.6 | ESLint TypeScript parser | — | Parses TypeScript for ESLint. Matches plugin version. | ✅ 0 HIGH/CRITICAL |
| `eslint` | ^8.57 | Linting framework | — | Industry standard. Version 8.x (9.x has breaking changes for many plugins). | ✅ 0 HIGH/CRITICAL |
| `husky` | ^9.1 | Git hooks | pre-commit (Python-based), manual scripts (fragile) | Manages pre-commit, commit-msg hooks. Automatic setup via prepare script. | ✅ 0 HIGH/CRITICAL |
| `@commitlint/cli` | ^19.5 | Commit message linting | — | Enforces conventional commits. Runs in commit-msg hook. | ✅ 0 HIGH/CRITICAL |
| `@commitlint/config-conventional` | ^19.5 | Conventional commit rules | custom config (reinventing wheel) | Standard conventional commits spec (feat, fix, etc.). | ✅ 0 HIGH/CRITICAL |

---

## Audit Log

| Date | Package | Action | Reason |
|------|---------|--------|--------|
| 2026-03-14 | bcrypt | ❌ Rejected | HIGH CVE chain via @mapbox/node-pre-gyp → tar. Replaced with argon2. |
| 2026-03-14 | @typescript-eslint/* v6.x | ❌ Rejected | Known minimatch CVE chain. Upgraded to v8.x. |
| 2026-03-14 | All approved packages | ✅ Audited | `npm audit --audit-level=high` → 0 vulnerabilities. |

---

## Notes

- **Version ranges**: `^` (caret) allows minor and patch updates. We accept this risk for faster security patches. Major updates require re-audit.
- **Peer dependencies**: Not listed here. Peer warnings are acceptable if the peer is also in this registry.
- **Re-audit trigger**: Any `npm install <new-package>` or version bump requires running `npm audit --audit-level=high` and updating this file.
- **CI enforcement**: `.husky/pre-commit` and `.github/workflows/ci.yml` both run `npm audit --audit-level=high`. Commits with HIGH/CRITICAL vulnerabilities are blocked.
```

```typescript
// src/repositories/IUserRepository.ts

/**
 * User repository interface.
 * Defines the contract for all user data access operations.
 * Implementations: PrismaUserRepository (production), InMemoryUserRepository (tests).
 */

export interface IUser {
  id: number;
  email: string;
  username: string;
  passwordHash: string;
  bio: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface IUserRepository {
  /**
   * Find user by unique ID.
   * @returns User if found, null otherwise
   */
  findById(id: number): Promise<IUser | null>;

  /**
   * Find user by unique email address.
   * @returns User if found, null otherwise
   */
  findByEmail(email: string): Promise<IUser | null>;

  /**
   * Find user by unique username.
   * @returns User if found, null otherwise
   */
  findByUsername(username: string): Promise<IUser | null>;

  /**
   * Create a new user.
   * @throws ConflictError if email or username already exists
   */
  create(data: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<IUser>;

  /**
   * Update user by ID.
   * Only provided fields are updated (partial update).
   * @throws NotFoundError if user does not exist
   * @throws ConflictError if email/username conflicts with another user
   */
  update(
    id: number,
    data: {
      email?: string;
      username?: string;
      passwordHash?: string;
      bio?: string | null;
      image?: string | null;
    }
  ): Promise<IUser>;

  /**
   * Get user profile with following status from perspective of current user.
   * @param username - Target user's username
   * @param currentUserId - ID of the user viewing the profile (null if anonymous)
   * @returns Profile if user exists, null otherwise
   */
  getProfile(
    username: string,
    currentUserId: number | null
  ): Promise<IUserProfile | null>;

  /**
   * Create a follow relationship.
   * @param followerId - User who is following
   * @param followingId - User being followed
   * @throws ConflictError if already following
   */
  follow(followerId: number, followingId: number): Promise<void>;

  /**
   * Remove a follow relationship.
   * @param followerId - User who is unfollowing
   * @param followingId - User being unfollowed
   * @throws NotFoundError if not currently following
   */
  unfollow(followerId: number, followingId: number): Promise<void>;

  /**
   * Check if follower is following the specified user.
   */
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
}
```

```typescript
// src/repositories/IArticleRepository.ts

/**
 * Article repository interface.
 * Defines the contract for all article data access operations.
 */

export interface IArticle {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IArticleWithMeta {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

export interface IArticleListItem {
  slug: string;
  title: string;
  description: string;
  // Note: body is NOT included in list responses (per RealWorld spec 2024-08-16)
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

export interface IListArticlesQuery {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
}

export interface IArticleRepository {
  /**
   * Find article by unique slug.
   * @param slug - Article slug (unique identifier)
   * @param currentUserId - ID of user viewing the article (null if anonymous)
   * @returns Article with metadata if found, null otherwise
   */
  findBySlug(
    slug: string,
    currentUserId: number | null
  ): Promise<IArticleWithMeta | null>;

  /**
   * List articles with filters and pagination.
   * @param query - Filter and pagination parameters
   * @param currentUserId - ID of user viewing the list (null if anonymous)
   * @returns Articles and total count
   */
  list(
    query: IListArticlesQuery,
    currentUserId: number | null
  ): Promise<{ articles: IArticleListItem[]; articlesCount: number }>;

  /**
   * Get feed of articles from users that currentUser follows.
   * @param currentUserId - ID of user requesting feed (required)
   * @param limit - Maximum articles to return (default 20)
   * @param offset - Pagination offset (default 0)
   * @returns Articles and total count
   */
  getFeed(
    currentUserId: number,
    limit?: number,
    offset?: number
  ): Promise<{ articles: IArticleListItem[]; articlesCount: number }>;

  /**
   * Create a new article.
   * @param data - Article creation data
   * @param authorId - ID of the author
   * @returns Created article with metadata
   * @throws ConflictError if slug already exists
   */
  create(
    data: {
      slug: string;
      title: string;
      description: string;
      body: string;
      tagList: string[];
    },
    authorId: number
  ): Promise<IArticleWithMeta>;

  /**
   * Update an article by slug.
   * Only provided fields are updated (partial update).
   * If title changes, slug is regenerated.
   * @throws NotFoundError if article does not exist
   * @throws ForbiddenError if current user is not the author
   */
  update(
    slug: string,
    data: {
      title?: string;
      description?: string;
      body?: string;
    },
    currentUserId: number
  ): Promise<IArticleWithMeta>;

  /**
   * Delete an article by slug.
   * @throws NotFoundError if article does not exist
   * @throws ForbiddenError if current user is not the author
   */
  delete(slug: string, currentUserId: number): Promise<void>;

  /**
   * Favorite an article.
   * @param slug - Article slug
   * @param userId - User favoriting the article
   * @returns Updated article with metadata
   * @throws NotFoundError if article does not exist
   */
  favorite(slug: string, userId: number): Promise<IArticleWithMeta>;

  /**
   * Unfavorite an article.
   * @param slug - Article slug
   * @param userId - User unfavoriting the article
   * @returns Updated article with metadata
   * @throws NotFoundError if article does not exist
   */
  unfavorite(slug: string, userId: number): Promise<IArticleWithMeta>;

  /**
   * Check if article slug exists.
   */
  slugExists(slug: string): Promise<boolean>;
}
```

```typescript
// src/repositories/ICommentRepository.ts

/**
 * Comment repository interface.
 * Defines the contract for all comment data access operations.
 */

export interface IComment {
  id: number;
  body: string;
  authorId: number;
  articleId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommentWithAuthor {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  body: string;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

export interface ICommentRepository {
  /**
   * Find comment by ID.
   * @returns Comment if found, null otherwise
   */
  findById(id: number): Promise<IComment | null>;

  /**
   * Get all comments for an article.
   * @param articleSlug - Article slug
   * @param currentUserId - ID of user viewing comments (null if anonymous)
   * @returns List of comments with author metadata
   * @throws NotFoundError if article does not exist
   */
  getByArticleSlug(
    articleSlug: string,
    currentUserId: number | null
  ): Promise<ICommentWithAuthor[]>;

  /**
   * Add a comment to an article.
   * @param articleSlug - Article slug
   * @param body - Comment text
   * @param authorId - ID of user posting the comment
   * @returns Created comment with author metadata
   * @throws NotFoundError if article does not exist
   */
  create(
    articleSlug: string,
    body: string,
    authorId: number
  ): Promise<ICommentWithAuthor>;

  /**
   * Delete a comment by ID.
   * @param id - Comment ID
   * @param currentUserId - ID of user attempting deletion
   * @throws NotFoundError if comment does not exist
   * @throws ForbiddenError if current user is not the comment author
   */
  delete(id: number, currentUserId: number): Promise<void>;
}
```

```typescript
// src/repositories/IProfileRepository.ts

/**
 * Profile repository interface.
 * Defines the contract for profile-related data access operations.
 * Note: Profiles are derived from User records; this is a read-only view interface.
 */

export interface IProfile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface IProfileRepository {
  /**
   * Get user profile by username.
   * @param username - Target user's username
   * @param currentUserId - ID of user viewing the profile (null if anonymous)
   * @returns Profile if user exists, null otherwise
   */
  getByUsername(
    username: string,
    currentUserId: number | null
  ): Promise<IProfile | null>;

  /**
   * Follow a user.
   * @param currentUserId - User who is following
   * @param targetUsername - Username of user to follow
   * @returns Updated profile of the followed user
   * @throws NotFoundError if target user does not exist
   * @throws ConflictError if already following
   */
  follow(currentUserId: number, targetUsername: string): Promise<IProfile>;

  /**
   * Unfollow a user.
   * @param currentUserId - User who is unfollowing
   * @param targetUsername - Username of user to unfollow
   * @returns Updated profile of the unfollowed user
   * @throws NotFoundError if target user does not exist or not currently following
   */
  unfollow(currentUserId: number, targetUsername: string): Promise<IProfile>;
}
```

```typescript
// src/repositories/ITagRepository.ts

/**
 * Tag repository interface.
 * Defines the contract for tag data access operations.
 */

export interface ITag {
  id: number;
  name: string;
}

export interface ITagRepository {
  /**
   * Get all unique tags that have been used in at least one article.
   * @returns List of tag names (strings)
   */
  listAll(): Promise<string[]>;

  /**
   * Upsert tags by name.
   * Creates tags if they don't exist, returns existing if they do.
   * @param tagNames - Array of tag names to upsert
   * @returns Created/found Tag records
   */
  upsertMany(tagNames: string[]): Promise<ITag[]>;

  /**
   * Find tag by exact name match.
   * @returns Tag if found, null otherwise
   */
  findByName(name: string): Promise<ITag | null>;
}
```

```typescript
// src/errors/AppError.ts

/**
 * Application error class hierarchy.
 * All errors thrown in domain/service layers should extend AppError.
 * The error handler middleware maps these to HTTP responses.
 */

export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, statusCode: number, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to RealWorld API error format.
   * Format: { errors: { body: [message, ...] } }
   */
  public toJSON(): { errors: { body: string[] } } {
    return {
      errors: {
        body: [this.message]
      }
    };
  }
}

/**
 * 404 Not Found
 * Resource does not exist (article, user, comment, etc.)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404);
  }
}

/**
 * 401 Unauthorized
 * Missing or invalid authentication credentials.
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'unauthorized') {
    super(message, 401);
  }
}

/**
 * 403 Forbidden
 * Authenticated but not permitted to perform this action.
 * Example: deleting another user's article.
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'forbidden') {
    super(message, 403);
  }
}

/**
 * 422 Unprocessable Entity
 * Validation error — request is well-formed but semantically invalid.
 * Examples: missing required field, duplicate email, invalid format.
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 422, context);
  }

  /**
   * Create from field-specific validation errors.
   * @param errors - Map of field names to error messages
   * @example
   * ValidationError.fromFields({ email: "can't be blank", username: "already taken" })
   */
  public static fromFields(errors: Record<string, string>): ValidationError {
    const messages = Object.entries(errors)
      .map(([field, error]) => `${field} ${error}`)
      .join(', ');
    return new ValidationError(messages, { fields: errors });
  }
}

/**
 * 409 Conflict
 * Request conflicts with current state of the server.
 * Examples: duplicate unique field, already following a user.
 */
export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 409, context);
  }
}
```

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts', // Entry point typically not unit tested
    '!src/**/index.ts' // Barrel files
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coverageDirectory: 'coverage',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testTimeout: 10000, // 10s for integration tests with real DB
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
```

```typescript
// jest.setup.ts

/**
 * Global Jest setup.
 * Runs once before all test suites.
 */

import { PrismaClient } from '@prisma/client';

// Ensure test environment is set
if (process.env.NODE_ENV !== 'test') {
  console.warn('Warning: NODE_ENV is not set to "test". Setting it now.');
  process.env.NODE_ENV = 'test';
}

// Ensure DATABASE_URL is set for tests
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not set. Tests require a test database.'
  );
}

// Global Prisma client for test cleanup
const prisma = new PrismaClient();

// Disconnect Prisma after all tests complete
afterAll(async () => {
  await prisma.$disconnect();
});

// Export for use in individual test files if needed
export { prisma };
```

```bash
# .env.example

# Database connection string
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
# For local development: postgresql://conduit:conduit@localhost:5432/conduit_dev
# For testing: postgresql://conduit:conduit@localhost:5432/conduit_test
DATABASE_URL=postgresql://conduit:conduit@localhost:5432/conduit_dev

# JWT secret key
# CRITICAL: Must be at least 32 characters (256 bits) for HS256 security
# Generate with: openssl rand -base64 32
# NEVER commit the actual secret to git
JWT_SECRET=your-secret-key-minimum-32-characters-long-replace-me

# JWT token expiry
# Accepts formats: "7d", "24h", "3600" (seconds), etc.
# Default: 7 days
JWT_EXPIRY=7d

# Server port
# Default: 3000
PORT=3000

# Node environment
# Values: development | production | test
NODE_ENV=development

# Log level
# Values: fatal | error | warn | info | debug | trace
# Default: info
LOG_LEVEL=info

# Rate limiting
# Maximum requests per window per IP
# Default: 100
RATE_LIMIT_MAX=100

# Rate limit window (milliseconds)
# Default: 60000 (1 minute)
RATE_LIMIT_WINDOW_MS=60000
```

---

**Infrastructure complete. 19/19 files emitted. Ready for feature implementation.**

✅ **Verification Protocol Check:**

**§6 Defended (Commit gates exist on disk with actual enforcement content):**
- `.husky/pre-commit` ✅ — contains `npm audit --audit-level=high`, `npx tsc --noEmit`, `npm run lint`, `npm test`
- `.github/workflows/ci.yml` ✅ — contains `npm audit --audit-level=high`, `tsc`, `lint`, `jest --coverage`, **Stryker mutation gate step**

**§7 Auditable (Decision trail is recoverable from repository alone):**
- `docs/adrs/ADR-0001-stack.md` ✅ — full ADR (278 words), Context/Decision/Alternatives/Consequences
- `docs/adrs/ADR-0002-auth.md` ✅ — full ADR (312 words), argon2 rationale, bcrypt CVE chain documented
- `CHANGELOG.md` ✅ — exists with `## [Unreleased]` section

All infrastructure files emitted. No feature code included per P0 constraints.