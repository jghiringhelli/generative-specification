# Approved Package Registry

Every runtime and development dependency must be listed here before use. New
packages require an entry (name, purpose, license, category) and must pass
`npm audit --audit-level=high`. This registry is the seed defaults table.

## Runtime Dependencies

| Package | Version | Purpose | License | Category |
|---|---|---|---|---|
| express | ^4.19.2 | HTTP framework (driving adapter) | MIT | Web |
| @prisma/client | ^5.19.0 | Generated type-safe DB client | Apache-2.0 | Persistence |
| prisma | ^5.19.0 | Schema, migrations, client generation | Apache-2.0 | Persistence |
| argon2 | ^0.40.3 | Password hashing (argon2id) | MIT | Security |
| jsonwebtoken | ^9.0.2 | JWT sign/verify | MIT | Security |
| zod | ^3.23.8 | Runtime input validation / DTO schemas | MIT | Validation |
| slugify | ^1.6.6 | Article slug generation | MIT | Utility |
| cors | ^2.8.5 | CORS middleware | MIT | Web |
| dotenv | ^16.4.5 | Environment variable loading | BSD-2-Clause | Config |
| express-async-errors | ^3.1.1 | Async error propagation to error handler | Apache-2.0 | Web |

## Development Dependencies

| Package | Version | Purpose | License | Category |
|---|---|---|---|---|
| typescript | ^5.5.4 | TypeScript compiler | Apache-2.0 | Build |
| ts-node-dev | ^2.0.0 | Dev server with reload | MIT | Build |
| jest | ^29.7.0 | Test runner | MIT | Test |
| ts-jest | ^29.2.4 | TypeScript transform for Jest | MIT | Test |
| supertest | ^7.0.0 | HTTP integration testing | MIT | Test |
| @types/* | latest | Type definitions | MIT | Types |
| eslint | ^8.57.0 | Linting | MIT | Lint |
| @typescript-eslint/parser | ^7.18.0 | TS parser for ESLint | MIT | Lint |
| @typescript-eslint/eslint-plugin | ^7.18.0 | TS lint rules | MIT | Lint |
| husky | ^9.1.4 | Git hooks | MIT | Tooling |
| @commitlint/cli | ^19.4.0 | Commit message linting | MIT | Tooling |
| @commitlint/config-conventional | ^19.2.2 | Conventional commit rules | MIT | Tooling |
| @stryker-mutator/core | ^8.2.6 | Mutation testing | Apache-2.0 | Test |
| @stryker-mutator/jest-runner | ^8.2.6 | Stryker Jest runner | Apache-2.0 | Test |
| @stryker-mutator/typescript-checker | ^8.2.6 | Stryker TS checker | Apache-2.0 | Test |
