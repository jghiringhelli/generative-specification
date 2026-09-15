# Approved Package Registry

This registry lists packages approved for use in the Conduit backend. Any new dependency must
be added here with a justification before it is introduced. Seed defaults are listed below.

## Runtime Dependencies

| Package | Version | Purpose | Justification |
|---|---|---|---|
| express | ^4.19.2 | HTTP framework | Core routing and middleware |
| @prisma/client | ^5.19.0 | ORM client | Type-safe database access |
| argon2 | ^0.40.3 | Password hashing | Memory-hard hashing (see ADR-0002) |
| jsonwebtoken | ^9.0.2 | JWT sign/verify | Stateless authentication (see ADR-0002) |
| zod | ^3.23.8 | Schema validation | Request input validation |
| slugify | ^1.6.6 | Slug generation | Article slug creation |
| cors | ^2.8.5 | CORS middleware | Cross-origin API access |
| dotenv | ^16.4.5 | Env loading | Local configuration |
| express-async-errors | ^3.1.1 | Async error handling | Forward async route errors |

## Development Dependencies

| Package | Version | Purpose | Justification |
|---|---|---|---|
| typescript | ^5.5.4 | Compiler | Strict typing |
| ts-node | ^10.9.2 | TS execution | Local dev/run |
| prisma | ^5.19.0 | ORM CLI | Migrations and generation |
| jest | ^29.7.0 | Test runner | Unit + integration tests |
| ts-jest | ^29.2.4 | TS transform | Run TS tests |
| supertest | ^7.0.0 | HTTP testing | Endpoint integration tests |
| eslint | ^8.57.0 | Linter | Code quality gate |
| @typescript-eslint/parser | ^7.18.0 | TS ESLint parser | Lint TypeScript |
| @typescript-eslint/eslint-plugin | ^7.18.0 | TS ESLint rules | Lint TypeScript |
| husky | ^9.1.4 | Git hooks | Commit gates |
| @commitlint/cli | ^19.4.0 | Commit lint | Conventional commits |
| @commitlint/config-conventional | ^19.2.2 | Commit lint config | Conventional commits |
| @stryker-mutator/core | ^8.2.6 | Mutation testing | Mutation gate |
| @stryker-mutator/jest-runner | ^8.2.6 | Stryker runner | Mutation gate |
| @stryker-mutator/typescript-checker | ^8.2.6 | Stryker checker | Mutation gate |
| @types/express | ^4.17.21 | Types | Express typings |
| @types/node | ^20.14.15 | Types | Node typings |
| @types/jest | ^29.5.12 | Types | Jest typings |
| @types/jsonwebtoken | ^9.0.6 | Types | JWT typings |
| @types/supertest | ^6.0.2 | Types | Supertest typings |
| @types/cors | ^2.8.17 | Types | CORS typings |
