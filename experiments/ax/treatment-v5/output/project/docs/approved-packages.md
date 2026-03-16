
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
