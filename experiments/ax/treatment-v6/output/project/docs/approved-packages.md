---
nav_exclude: true
---

# Approved Package Registry

This registry documents every dependency added to the project. Each entry must be completed before the dependency is committed to `package.json`. Zero HIGH/CRITICAL CVEs are permitted without a corresponding ADR security exception.

| Package | Version range | Purpose | Alternatives rejected | Rationale | Audit status |
|---|---|---|---|---|---|
| express | ^4.21 | HTTP server framework | fastify (plugin encapsulation conflicts with DI pattern), hono (too new, insufficient audit coverage), nestjs (decorator-heavy, violates explicit-over-clever preference) | Stable, widely audited, unopinionated middleware model | ✅ 0 HIGH/CRITICAL |
| @prisma/client | ^5.22 | Database ORM client | typeorm (decorator-based, active CVEs), drizzle (immature migration story), knex (no type generation), raw pg (no schema management) | Type-safe queries, schema-as-code migrations, excellent TypeScript integration | ✅ 0 HIGH/CRITICAL |
| argon2 | ^0.41 | Password hashing | bcrypt (pulls in node-pre-gyp → tar CVE chain: CVE-2021-32803, CVE-2021-32804, CVE-2021-37701, CVE-2021-37712 — all HIGH) | No native compilation CVE chain, memory-hard argon2id is OWASP recommended, WebAssembly fallback | ✅ 0 HIGH/CRITICAL |
| jsonwebtoken | ^9 | JWT signing and verification | paseto (less community adoption), jose (adds complexity), built-in crypto (no JWT abstraction) | Mature library, required by RealWorld spec Token header convention, 9.x resolves prior CVEs | ✅ 0 HIGH/CRITICAL |
| zod | ^3 | Runtime schema validation and type inference | joi (no TypeScript inference), yup (slower, worse TS support), class-validator (decorator-based) | Best-in-class TypeScript type inference, composable schemas, zero runtime dependencies | ✅ 0 HIGH/CRITICAL |
| prisma | ^5.22 | Prisma CLI (dev) | N/A — pairs with @prisma/client | Schema management, migration runner, code generator | ✅ 0 HIGH/CRITICAL |
| typescript | ^5 | TypeScript compiler (dev) | N/A — language toolchain | Required for strict type checking | ✅ 0 HIGH/CRITICAL |
| @types/express | ^4 | Express TypeScript types (dev) | N/A — type definitions | Required for TypeScript strict mode | ✅ 0 HIGH/CRITICAL |
| jest | ^29 | Test runner (dev) | vitest (ESM support less mature with Prisma), mocha (more configuration overhead) | Mature, excellent TypeScript support via ts-jest, supertest integration | ✅ 0 HIGH/CRITICAL |
| ts-jest | ^29 | Jest TypeScript transformer (dev) | babel-jest (loses type safety), esbuild-jest (less mature) | Native TypeScript compilation in jest, preserves type errors in tests | ✅ 0 HIGH/CRITICAL |
| supertest | ^7 | HTTP integration testing (dev) | axios (not test-focused), node-fetch (no test assertion helpers) | Express-native integration testing, chainable assertions | ✅ 0 HIGH/CRITICAL |
| @typescript-eslint/eslint-plugin | ^8 | TypeScript ESLint rules (dev) | ^6 (known minimatch CVE chain), ^7 (less stable) | ^8 resolves prior minimatch transitive CVE, comprehensive TypeScript rule set | ✅ 0 HIGH/CRITICAL |
| @typescript-eslint/parser | ^8 | TypeScript ESLint parser (dev) | N/A — pairs with plugin | Required for TypeScript-aware linting | ✅ 0 HIGH/CRITICAL |
| eslint | ^8 | JavaScript/TypeScript linter (dev) | N/A — industry standard | Required for code quality enforcement | ✅ 0 HIGH/CRITICAL |
| husky | ^9 | Git hooks (dev) | lefthook (less community adoption), pre-commit (Python ecosystem) | Mature, pairs with commitlint, simple configuration | ✅ 0 HIGH/CRITICAL |
| @commitlint/cli | ^19 | Commit message linting (dev) | N/A — pairs with config-conventional | Enforces conventional commits format | ✅ 0 HIGH/CRITICAL |
| @commitlint/config-conventional | ^19 | Conventional commits ruleset (dev) | N/A — standard ruleset | Industry standard commit format | ✅ 0 HIGH/CRITICAL |
| @stryker-mutator/core | ^8 | Mutation testing framework (dev) | pitest (Java), mutmut (Python) | Node.js ecosystem, jest integration, CI-compatible | ✅ 0 HIGH/CRITICAL |
| @stryker-mutator/jest-runner | ^8 | Stryker jest runner (dev) | N/A — pairs with stryker core | Required for running mutation tests with jest | ✅ 0 HIGH/CRITICAL |
| @types/jest | ^29 | Jest TypeScript types (dev) | N/A — type definitions | Required for TypeScript strict mode in tests | ✅ 0 HIGH/CRITICAL |
| @types/jsonwebtoken | ^9 | jsonwebtoken TypeScript types (dev) | N/A — type definitions | Required for TypeScript strict mode | ✅ 0 HIGH/CRITICAL |
| @types/node | ^20 | Node.js TypeScript types (dev) | N/A — type definitions | Required for TypeScript strict mode | ✅ 0 HIGH/CRITICAL |
| @types/supertest | ^6 | supertest TypeScript types (dev) | N/A — type definitions | Required for TypeScript strict mode in tests | ✅ 0 HIGH/CRITICAL |
| ts-node | ^10 | TypeScript execution for dev server (dev) | tsx (newer, less mature), ts-node-dev (less maintained) | Standard TypeScript execution tool for development | ✅ 0 HIGH/CRITICAL |
