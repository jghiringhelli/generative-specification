# Approved Package Registry

This registry enforces audit-before-add. Every dependency must pass `npm audit --audit-level=high` before being added to `package.json`.

## Process

1. Run `npm audit --audit-level=high <package>` before adding
2. If HIGH/CRITICAL CVEs found, reject and document alternative
3. Add to this table with rationale
4. Update after every `npm install`

## Current Registry

| Package | Version range | Purpose | Alternatives rejected | Rationale | Audit status |
|---------|---------------|---------|----------------------|-----------|--------------|
| express | ^4.21.2 | HTTP server framework | fastify (heavier), hono (too new for this stack) | Stable, widely audited, RealWorld reference standard | ✅ 0 HIGH/CRITICAL |
| @prisma/client | ^5.22.0 | Database ORM client | drizzle (less mature), raw pg (more boilerplate) | Type-safe, schema-as-source-of-truth | ✅ 0 HIGH/CRITICAL |
| prisma | ^5.22.0 | Prisma CLI tooling | n/a | Required for @prisma/client | ✅ 0 HIGH/CRITICAL |
| argon2 | ^0.41.1 | Password hashing | bcrypt (CVE chain via tar/node-pre-gyp), scrypt (less audited) | OWASP recommended, no native dep CVEs | ✅ 0 HIGH/CRITICAL |
| jsonwebtoken | ^9.0.2 | JWT signing/verification | jose (newer, less adopted), paseto (different standard) | Industry standard, well-audited | ✅ 0 HIGH/CRITICAL |
| zod | ^3.24.1 | Runtime schema validation | joi (not type-safe), yup (weaker inference) | Best TypeScript integration, composable | ✅ 0 HIGH/CRITICAL |
| typescript | ^5.7.2 | TypeScript compiler | n/a | Required for project | ✅ 0 HIGH/CRITICAL |
| @types/node | ^22.10.5 | Node.js type definitions | n/a | Required for Node types | ✅ 0 HIGH/CRITICAL |
| @types/express | ^4.17.21 | Express type definitions | n/a | Required for Express types | ✅ 0 HIGH/CRITICAL |
| @types/jsonwebtoken | ^9.0.7 | JWT type definitions | n/a | Required for jsonwebtoken types | ✅ 0 HIGH/CRITICAL |
| tsx | ^4.19.2 | TypeScript execution | ts-node (slower), esbuild-register (less mature) | Fast, modern, no compilation step needed for dev | ✅ 0 HIGH/CRITICAL |
| jest | ^29.7.0 | Test runner | vitest (newer, less stable), mocha (more boilerplate) | Industry standard, excellent TypeScript support | ✅ 0 HIGH/CRITICAL |
| ts-jest | ^29.2.5 | Jest TypeScript transformer | babel-jest (extra config) | Official Jest TS integration | ✅ 0 HIGH/CRITICAL |
| @types/jest | ^29.5.14 | Jest type definitions | n/a | Required for Jest types | ✅ 0 HIGH/CRITICAL |
| supertest | ^7.0.0 | HTTP integration testing | axios (manual server management) | De facto standard for Express testing | ✅ 0 HIGH/CRITICAL |
| @types/supertest | ^6.0.2 | Supertest type definitions | n/a | Required for supertest types | ✅ 0 HIGH/CRITICAL |
| @typescript-eslint/eslint-plugin | ^8.18.2 | TypeScript linting | @typescript-eslint@^6 (minimatch CVE), tslint (deprecated) | Latest version, no known CVEs | ✅ 0 HIGH/CRITICAL |
| @typescript-eslint/parser | ^8.18.2 | ESLint TypeScript parser | n/a | Required for eslint-plugin | ✅ 0 HIGH/CRITICAL |
| eslint | ^9.18.0 | Linting framework | n/a | Industry standard | ✅ 0 HIGH/CRITICAL |
| husky | ^9.1.7 | Git hooks | pre-commit (Python dep), simple-git-hooks (less features) | Most popular, native Node.js | ✅ 0 HIGH/CRITICAL |
| @commitlint/cli | ^19.6.1 | Commit message linting | n/a | Conventional commits enforcement | ✅ 0 HIGH/CRITICAL |
| @commitlint/config-conventional | ^19.6.0 | Commitlint conventional config | n/a | Standard config | ✅ 0 HIGH/CRITICAL |
| cors | ^2.8.5 | CORS middleware | manual headers (error-prone) | Standard Express middleware | ✅ 0 HIGH/CRITICAL |
| @types/cors | ^2.8.17 | CORS type definitions | n/a | Required for cors types | ✅ 0 HIGH/CRITICAL |
| dotenv | ^16.4.7 | Environment variable loader | cross-env (different use case) | Standard for .env files | ✅ 0 HIGH/CRITICAL |
| express-rate-limit | ^7.5.0 | Rate limiting middleware | rate-limiter-flexible (more complex) | Simple, Express-native | ✅ 0 HIGH/CRITICAL |

## Audit Log

- 2026-03-13: Initial registry created with seed defaults
- 2026-03-13: All packages audited — 0 HIGH/CRITICAL vulnerabilities
