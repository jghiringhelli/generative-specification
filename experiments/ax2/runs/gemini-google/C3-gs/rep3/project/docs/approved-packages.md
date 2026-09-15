# Approved Package Registry

The following third-party dependencies are approved for use within this project. Any addition must be documented here with justification, license compliance check, and security assessment.

| Package Name | Category | License | Justification |
| :--- | :--- | :--- | :--- |
| `express` | Runtime / HTTP Framework | MIT | Minimalist, reliable HTTP server and routing engine |
| `@prisma/client` | Runtime / Persistence | Apache-2.0 | Type-safe database client generated from Prisma schema |
| `prisma` | Dev / Tooling | Apache-2.0 | Schema migration and Prisma client generation engine |
| `argon2` | Runtime / Security | MIT | Memory-hard password hashing algorithm (PHC winner) |
| `jsonwebtoken` | Runtime / Security | MIT | Stateless token minting and signature verification |
| `cors` | Runtime / Middleware | MIT | Cross-Origin Resource Sharing handling for browser clients |
| `dotenv` | Runtime / Configuration | BSD-2-Clause | Environment variable loading from `.env` files |
| `typescript` | Dev / Tooling | Apache-2.0 | Static typing and modern ECMAScript compilation |
| `@types/*` | Dev / Typing | MIT | TypeScript type declarations for ecosystem packages |
| `jest` | Dev / Testing | MIT | Unit and integration testing test runner and assertion framework |
| `ts-jest` | Dev / Testing | MIT | TypeScript preprocessor for Jest execution |
| `supertest` | Dev / Testing | MIT | HTTP assertions against Express endpoints without binding network sockets |
| `eslint` | Dev / Quality | MIT | Static code analysis and linting engine |
| `@typescript-eslint/*` | Dev / Quality | MIT | TypeScript AST parser and linting rules |
| `husky` | Dev / Quality | MIT | Git hook execution for pre-commit quality enforcement |
| `@commitlint/*` | Dev / Quality | MIT | Conventional commit format enforcement |
| `@stryker-mutator/*` | Dev / Quality | Apache-2.0 | Mutation testing framework to evaluate test suite robustness |
