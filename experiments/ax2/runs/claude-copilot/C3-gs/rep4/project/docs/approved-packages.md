# Approved Packages Registry

Every runtime and development dependency must be recorded here before use. New packages
require an entry (name, purpose, license, justification) and pass `npm audit --audit-level=high`.

## Seed Defaults — Runtime

| Package | Version | Purpose | License | Justification |
|---|---|---|---|---|
| express | ^4.19.2 | HTTP driving adapter (routing, middleware) | MIT | Stable, minimal web framework (ADR-0001) |
| @prisma/client | ^5.19.1 | Typed database client (driven adapter) | Apache-2.0 | Persistence port implementation (ADR-0001) |
| argon2 | ^0.41.1 | Password hashing (argon2id) | MIT | OWASP-recommended, avoids bcrypt/node-pre-gyp (ADR-0002) |
| jsonwebtoken | ^9.0.2 | JWT sign/verify for stateless auth | MIT | Standard JWT implementation (ADR-0002) |
| zod | ^3.23.8 | Runtime input validation at API boundary | MIT | Type-safe request DTO validation |
| slugify | ^1.6.6 | Deterministic article slug generation | MIT | Consistent, URL-safe slugs |
| cors | ^2.8.5 | Cross-origin resource sharing middleware | MIT | Browser SPA clients |
| dotenv | ^16.4.5 | Load environment configuration | BSD-2-Clause | Config from environment (fail-fast startup) |
| express-async-errors | ^3.1.1 | Propagate async errors to error handler | Apache-2.0 | Express 4 lacks native async error handling |

## Seed Defaults — Development

| Package | Version | Purpose | License | Justification |
|---|---|---|---|---|
| typescript | ^5.5.4 | Type system and compiler | Apache-2.0 | Strict typing (ADR-0001) |
| ts-node | ^10.9.2 | Run TypeScript without precompiling | MIT | Local dev/execution |
| prisma | ^5.19.1 | Schema, migrations, client generation | Apache-2.0 | Migrations (ADR-0001) |
| jest | ^29.7.0 | Test runner | MIT | Unit/integration testing |
| ts-jest | ^29.2.4 | TypeScript transform for Jest | MIT | Type-aware tests |
| supertest | ^7.0.0 | HTTP assertions for integration tests | MIT | Endpoint testing |
| @types/* | latest | Type definitions | MIT | Typed dependencies |
| eslint | ^8.57.0 | Linting | MIT | Static analysis gate |
| @typescript-eslint/* | ^7.18.0 | TypeScript ESLint tooling | MIT/BSD-2-Clause | TS-aware lint rules |
| husky | ^9.1.4 | Git hooks | MIT | Commit gates |
| @commitlint/cli | ^19.4.0 | Conventional commit enforcement | MIT | commit-msg gate |
| @commitlint/config-conventional | ^19.2.2 | Conventional commit ruleset | MIT | commit-msg gate |
| @stryker-mutator/core | ^8.5.0 | Mutation testing | Apache-2.0 | Mutation score gate |
| @stryker-mutator/jest-runner | ^8.5.0 | Stryker Jest runner | Apache-2.0 | Mutation testing with Jest |
| @stryker-mutator/typescript-checker | ^8.5.0 | Stryker type checker | Apache-2.0 | Type-safe mutants |
