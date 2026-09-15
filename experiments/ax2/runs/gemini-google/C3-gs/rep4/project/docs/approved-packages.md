# Approved Package Registry

This registry tracks and governs all external third-party dependencies approved for use within the Conduit backend project. Any addition or upgrade must be verified against vulnerability databases before inclusion.

| Package | Version | Purpose / Role | Security Status |
|---|---|---|---|
| `@prisma/client` | `^5.10.0` | ORM runtime client for PostgreSQL database operations | Verified clean; zero high CVEs |
| `argon2` | `^0.40.1` | Cryptographic password hashing (Argon2id) | Verified clean; avoids node-pre-gyp CVE chain |
| `cors` | `^2.8.5` | Express Cross-Origin Resource Sharing middleware | Standard vetted utility; zero high CVEs |
| `dotenv` | `^16.4.5` | Environment variable loader from `.env` files | Verified clean; zero high CVEs |
| `express` | `^4.19.2` | Core HTTP routing framework and driving adapter | Mainstream production release; zero high CVEs |
| `jsonwebtoken` | `^9.0.2` | Stateless JSON Web Token generation and validation | Verified clean; standard algorithm enforcement |
| `slugify` | `^1.6.6` | Deterministic URL-safe slug generation for articles | Zero external dependencies; verified clean |
| `@commitlint/cli` | `^19.0.0` | Commit message convention enforcement (Dev) | Tooling dependency; verified clean |
| `@commitlint/config-conventional` | `^19.0.0` | Conventional commit presets (Dev) | Tooling dependency; verified clean |
| `@stryker-mutator/core` | `^8.0.0` | Mutation testing framework for test adequacy (Dev) | Tooling dependency; verified clean |
| `@types/*` | Various | TypeScript type definitions for runtime libraries (Dev) | Compile-time typings; verified clean |
| `eslint` | `^8.57.0` | Static code analysis and linting (Dev) | Tooling dependency; verified clean |
| `husky` | `^9.0.11` | Git hooks manager for pre-commit / commit-msg (Dev) | Tooling dependency; verified clean |
| `jest` | `^29.7.0` | Test runner and assertion library (Dev) | Tooling dependency; verified clean |
| `prisma` | `^5.10.0` | Database schema migrations and client generator (Dev) | Tooling dependency; verified clean |
| `supertest` | `^6.3.4` | HTTP assertion library for integration testing (Dev) | Tooling dependency; verified clean |
| `ts-jest` | `^29.1.2` | TypeScript preprocessor for Jest (Dev) | Tooling dependency; verified clean |
| `ts-node` | `^10.9.2` | TypeScript execution engine for development (Dev) | Tooling dependency; verified clean |
| `typescript` | `^5.3.3` | Static type checker and compiler (Dev) | Tooling dependency; verified clean |
