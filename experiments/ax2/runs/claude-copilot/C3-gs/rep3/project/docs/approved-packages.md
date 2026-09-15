# Approved Packages Registry

This registry lists packages approved for use in the Conduit backend. Every
production and development dependency must appear here with a justification.
Adding a new dependency requires a new row and review.

## Runtime Dependencies

| Package | Version | Purpose | Approved |
|---|---|---|---|
| `@prisma/client` | ^5.19.0 | Generated, typed database client | ✅ |
| `argon2` | ^0.40.3 | Password hashing (argon2id) | ✅ |
| `cors` | ^2.8.5 | Cross-origin resource sharing middleware | ✅ |
| `dotenv` | ^16.4.5 | Environment variable loading | ✅ |
| `express` | ^4.19.2 | HTTP framework (driving adapter) | ✅ |
| `express-async-errors` | ^3.1.1 | Async error propagation to error middleware | ✅ |
| `jsonwebtoken` | ^9.0.2 | JWT sign/verify for stateless auth | ✅ |
| `slugify` | ^1.6.6 | Deterministic article slug generation | ✅ |
| `zod` | ^3.23.8 | Runtime input validation at API boundary | ✅ |

## Development Dependencies

| Package | Version | Purpose | Approved |
|---|---|---|---|
| `typescript` | ^5.5.4 | TypeScript compiler | ✅ |
| `ts-node-dev` | ^2.0.0 | Dev server with reload | ✅ |
| `prisma` | ^5.19.0 | Prisma CLI and migrations | ✅ |
| `jest` | ^29.7.0 | Test runner | ✅ |
| `ts-jest` | ^29.2.4 | TypeScript transform for Jest | ✅ |
| `supertest` | ^7.0.0 | HTTP integration testing | ✅ |
| `eslint` | ^8.57.0 | Linting | ✅ |
| `@typescript-eslint/parser` | ^7.18.0 | TS ESLint parser | ✅ |
| `@typescript-eslint/eslint-plugin` | ^7.18.0 | TS ESLint rules | ✅ |
| `husky` | ^9.1.4 | Git hooks | ✅ |
| `@commitlint/cli` | ^19.4.0 | Commit message linting | ✅ |
| `@commitlint/config-conventional` | ^19.2.2 | Conventional commit rules | ✅ |
| `@stryker-mutator/core` | ^8.5.0 | Mutation testing | ✅ |
| `@stryker-mutator/jest-runner` | ^8.5.0 | Stryker Jest runner | ✅ |
| `@stryker-mutator/typescript-checker` | ^8.5.0 | Stryker TS checker | ✅ |
| `@types/*` | latest | Type definitions | ✅ |
