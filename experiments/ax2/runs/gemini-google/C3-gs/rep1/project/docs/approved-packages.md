# Approved Package Registry

This registry tracks the approved external dependencies for the Conduit backend application. Any addition to `package.json` must be documented and vetted here.

| Package | Version | Type | Purpose | Justification |
|---|---|---|---|---|
| `express` | ^4.19.2 | Runtime | HTTP Web Framework | Battle-tested, minimalist web framework for routing and middleware. |
| `@prisma/client` | ^5.14.0 | Runtime | Database ORM Client | Type-safe database query client generated directly from Prisma schema. |
| `argon2` | ^0.40.1 | Runtime | Password Hashing | Memory-hard password hashing algorithm, winner of PHC; safe alternative to bcrypt. |
| `jsonwebtoken` | ^9.0.2 | Runtime | Authentication | Industry-standard implementation for issuing and verifying JWTs. |
| `zod` | ^3.23.8 | Runtime | Request Validation | Declarative, TypeScript-first schema validation for request payloads. |
| `slugify` | ^1.6.6 | Runtime | String Utilities | URL-safe slug generation for article titles. |
| `dotenv` | ^16.4.5 | Runtime | Environment Configuration | Loads environment variables from `.env` file into `process.env`. |
| `cors` | ^2.8.5 | Runtime | Middleware | Cross-Origin Resource Sharing middleware for client compatibility. |
| `typescript` | ^5.4.5 | Dev | Compiler | Static typing and modern JavaScript compilation. |
| `prisma` | ^5.14.0 | Dev | CLI / Tooling | Prisma CLI for schema management and migrations. |
| `jest` | ^29.7.0 | Dev | Testing Framework | Comprehensive test runner and assertion library. |
| `ts-jest` | ^29.1.3 | Dev | Testing Tooling | TypeScript preprocessor for Jest. |
| `supertest` | ^7.0.0 | Dev | Testing Tooling | HTTP assertion library for API integration testing. |
| `husky` | ^8.0.3 | Dev | Git Hooks | Manages Git pre-commit and commit-msg quality gates. |
| `@commitlint/cli` | ^19.3.0 | Dev | Git Tooling | Enforces Conventional Commits specification. |
| `@commitlint/config-conventional` | ^19.2.2 | Dev | Git Tooling | Shared config for conventional commit format. |
| `eslint` | ^8.57.0 | Dev | Linter | Static code analysis and lint rule enforcement. |
| `@typescript-eslint/parser` | ^7.10.0 | Dev | Linter | ESLint parser for TypeScript AST. |
| `@typescript-eslint/eslint-plugin` | ^7.10.0 | Dev | Linter | TypeScript specific linting rules. |
| `@stryker-mutator/core` | ^8.2.6 | Dev | Quality Gate | Mutation testing framework measuring test suite behavioral rigor. |
| `@stryker-mutator/jest-runner` | ^8.2.6 | Dev | Quality Gate | Stryker runner for Jest test execution. |
