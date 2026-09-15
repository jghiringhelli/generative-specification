# Approved Package Registry

This registry documents all approved external dependencies for the Conduit backend project. Every dependency must be documented here with its approved version constraint, purpose, and rationale.

| Package Name | Type | Version | Purpose | Rationale | Approved Date |
|---|---|---|---|---|---|
| `express` | runtime | `^4.19.2` | HTTP web application framework | Battle-tested, minimalist web server foundation for RESTful APIs. | 2026-09-15 |
| `@prisma/client` | runtime | `^5.14.0` | Type-safe database query client | Auto-generated database client tied to schema definitions. | 2026-09-15 |
| `argon2` | runtime | `^0.40.1` | Cryptographic password hashing | Memory-hard PHC winner; avoids bcrypt's node-pre-gyp CVE chain. | 2026-09-15 |
| `jsonwebtoken` | runtime | `^9.0.2` | JWT generation and verification | Standard implementation for RFC 7519 JSON Web Tokens. | 2026-09-15 |
| `zod` | runtime | `^3.23.8` | Schema validation | Type-safe schema declaration and validation for HTTP request bodies. | 2026-09-15 |
| `slugify` | runtime | `^1.6.6` | URL slug generation | Robust slugification of article titles into unique URL slugs. | 2026-09-15 |
| `cors` | runtime | `^2.8.5` | Cross-Origin Resource Sharing | Standard middleware to enable cross-origin browser requests. | 2026-09-15 |
| `dotenv` | runtime | `^16.4.5` | Environment variable loader | Zero-dependency module that loads environment variables from `.env`. | 2026-09-15 |
| `typescript` | dev | `^5.4.5` | Static type system | Enforces compile-time type safety across the entire codebase. | 2026-09-15 |
| `prisma` | dev | `^5.14.0` | Database ORM CLI & migration engine | Manages PostgreSQL schema migrations and client code generation. | 2026-09-15 |
| `jest` | dev | `^29.7.0` | Test runner and assertion library | Industry-standard unit and integration testing framework. | 2026-09-15 |
| `ts-jest` | dev | `^29.1.3` | TypeScript preprocessor for Jest | Enables in-memory compilation of TypeScript test files. | 2026-09-15 |
| `supertest` | dev | `^7.0.0` | HTTP assertion library | Enables black-box integration testing against Express HTTP endpoints. | 2026-09-15 |
| `husky` | dev | `^8.0.3` | Git hook manager | Enforces pre-commit and commit-msg quality gates automatically. | 2026-09-15 |
| `@commitlint/cli` | dev | `^19.3.0` | Conventional commit linter | Enforces structured commit messages conforming to Conventional Commits. | 2026-09-15 |
| `@stryker-mutator/core` | dev | `^8.2.6` | Mutation testing framework | Validates test suite efficacy through automated mutation analysis. | 2026-09-15 |
| `eslint` | dev | `^8.57.0` | Code linter | Enforces stylistic and semantic standards across TypeScript files. | 2026-09-15 |
