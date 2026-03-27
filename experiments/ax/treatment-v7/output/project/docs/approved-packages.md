# Approved Package Registry

All dependencies are audited before addition per the project policy: zero HIGH/CRITICAL CVEs permitted without a named ADR security exception (`docs/adrs/ADR-XXXX-security-exception.md`).

Audit command: `npm audit --audit-level=high`

## Runtime Dependencies

| Package | Version range | Purpose | Alternatives rejected | Rationale | Audit status |
|---|---|---|---|---|---|
| express | ^4.21 | HTTP server framework | fastify (heavier plugin model), hono (too new) | Stable, minimal, widely audited; zero CVEs in v4.21 | ✅ 0 HIGH/CRITICAL |
| @prisma/client | ^5.22 | Database ORM client | typeorm (decorator CVEs, circular deps), drizzle (young) | Type-safe generated queries; first-class migration tooling | ✅ 0 HIGH/CRITICAL |
| argon2 | ^0.41 | Password hashing | bcrypt (3 HIGH CVEs via tar chain — see ADR-0002) | OWASP-recommended; memory-hard; no node-pre-gyp CVE chain | ✅ 0 HIGH/CRITICAL |
| jsonwebtoken | ^9.0 | JWT signing and verification | jose (ESM-only complexity) | Stable, widely deployed; v9 has 0 CVEs; CJS-safe with default import pattern | ✅ 0 HIGH/CRITICAL |
| zod | ^3.23 | Runtime input validation and schema inference | joi (heavier), yup (slower inference) | TypeScript-first; inferred types at boundaries; tree-shakeable | ✅ 0 HIGH/CRITICAL |

## Development Dependencies

| Package | Version range | Purpose | Alternatives rejected | Rationale | Audit status |
|---|---|---|---|---|---|
| prisma | ^5.22 | Prisma CLI (migrate, generate, studio) | — | Required companion to @prisma/client | ✅ 0 HIGH/CRITICAL |
| typescript | ^5.7 | TypeScript compiler | — | Language requirement; v5.7 adds stricter checks | ✅ 0 HIGH/CRITICAL |
| @types/express | ^4.17 | Express TypeScript type definitions | — | Required for TypeScript development | ✅ 0 HIGH/CRITICAL |
| @types/jsonwebtoken | ^9.0 | jsonwebtoken TypeScript definitions | — | Required; provides SignOptions, JwtPayload | ✅ 0 HIGH/CRITICAL |
| @types/node | ^20.17 | Node.js TypeScript definitions | — | Required for process.env, Buffer, etc. | ✅ 0 HIGH/CRITICAL |
| jest | ^29.7 | Test runner | vitest (ESM-first, complex with ts-jest) | Mature ecosystem; excellent ts-jest integration; v29 is stable | ✅ 0 HIGH/CRITICAL |
| ts-jest | ^29.2 | TypeScript transformer for Jest | babel-jest (less type-safe, no tsconfig respect) | Runs TypeScript tests with full type checking via tsc | ✅ 0 HIGH/CRITICAL |
| @types/jest | ^29.5 | Jest TypeScript type definitions | — | Required for TypeScript test files | ✅ 0 HIGH/CRITICAL |
| @typescript-eslint/eslint-plugin | ^8.18 | TypeScript-aware ESLint rules | tslint (deprecated) | Current standard; **@^8 avoids minimatch CVE chain present in @^6** | ✅ 0 HIGH/CRITICAL |
| @typescript-eslint/parser | ^8.18 | TypeScript ESLint parser | — | Required companion to eslint-plugin | ✅ 0 HIGH/CRITICAL |
| eslint | ^8.57 | JavaScript/TypeScript linter | oxlint (too new, incomplete rule coverage) | Industry standard; v8.57 stable with @typescript-eslint/v8 | ✅ 0 HIGH/CRITICAL |
| husky | ^9.1 | Git hooks manager | lefthook (less Node ecosystem integration) | Native Node hooks; v9 minimal footprint; integrates with `prepare` script | ✅ 0 HIGH/CRITICAL |
| @commitlint/cli | ^19.6 | Commit message linting | commitizen (interactive-only, no CI enforcement) | Enforces conventional commits in both pre-commit hooks and CI | ✅ 0 HIGH/CRITICAL |
| @commitlint/config-conventional | ^19.6 | Conventional commits ruleset | — | Required companion to @commitlint/cli | ✅ 0 HIGH/CRITICAL |
| @stryker-mutator/core | ^8.7 | Mutation testing engine | pitest (Java), cosmic-ray (Python) | Node-native; integrates with Jest; measures test quality not just coverage | ✅ 0 HIGH/CRITICAL |
| @stryker-mutator/jest-runner | ^8.7 | Stryker adapter for Jest | — | Required to execute mutations against the Jest test suite | ✅ 0 HIGH/CRITICAL |
| tsx | ^4.19 | TypeScript execution and watch mode | ts-node (slower watch, CJS-only in some modes) | Fast ESM/CJS-agnostic execution; no compilation step for dev server | ✅ 0 HIGH/CRITICAL |
| supertest | ^7.0 | HTTP integration test client | axios (no server binding), node-fetch (no superagent API) | De-facto standard for Express integration tests; binds server without listen | ✅ 0 HIGH/CRITICAL |
| @types/supertest | ^6.0 | supertest TypeScript definitions | — | Required companion for TypeScript test files | ✅ 0 HIGH/CRITICAL |

## CVE Exception Log

_No exceptions. All packages pass the zero HIGH/CRITICAL requirement at time of registry creation._

_Any future exception must reference a named ADR at `docs/adrs/ADR-XXXX-security-exception.md`._
