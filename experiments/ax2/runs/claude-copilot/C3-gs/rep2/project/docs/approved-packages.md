# Approved Package Registry

Every runtime and development dependency must appear in this registry before use, per
CLAUDE.md § Dependency Registry. New packages require an entry with a justification and
review sign-off.

## Runtime Dependencies

| Package | Version | Purpose | Status |
| --- | --- | --- | --- |
| `express` | ^4.21.0 | HTTP framework (driving adapter layer) | Approved |
| `@prisma/client` | ^5.20.0 | Generated type-safe database client | Approved |
| `prisma` | ^5.20.0 | Schema, migrations, client generator (CLI) | Approved |
| `argon2` | ^0.41.1 | Password hashing (argon2id) | Approved |
| `jsonwebtoken` | ^9.0.2 | JWT signing and verification | Approved |
| `zod` | ^3.23.8 | Request validation and schema parsing | Approved |
| `slugify` | ^1.6.6 | Deterministic article slug generation | Approved |
| `cors` | ^2.8.5 | Cross-origin resource sharing middleware | Approved |
| `dotenv` | ^16.4.5 | Environment variable loading | Approved |
| `express-async-errors` | ^3.1.1 | Async error propagation to error middleware | Approved |

## Development Dependencies

| Package | Version | Purpose | Status |
| --- | --- | --- | --- |
| `typescript` | ^5.6.2 | TypeScript compiler | Approved |
| `ts-node-dev` | ^2.0.0 | Dev server with reload | Approved |
| `jest` | ^29.7.0 | Test runner | Approved |
| `ts-jest` | ^29.2.5 | TypeScript transform for Jest | Approved |
| `supertest` | ^7.0.0 | HTTP integration testing | Approved |
| `@types/*` | latest | Type definitions | Approved |
| `eslint` | ^8.57.1 | Linting | Approved |
| `@typescript-eslint/*` | ^8.8.0 | TypeScript ESLint plugin/parser | Approved |
| `husky` | ^9.1.6 | Git hooks | Approved |
| `@commitlint/*` | ^19.5.0 | Conventional commit enforcement | Approved |
| `@stryker-mutator/*` | ^8.5.0 | Mutation testing gate | Approved |
