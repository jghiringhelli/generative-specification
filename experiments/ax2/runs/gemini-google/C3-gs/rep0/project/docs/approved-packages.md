# Approved Package Registry

The following third-party dependencies are approved for use within the RealWorld Conduit backend project. Adding new packages requires an architectural review and documented security assessment.

| Package | Version Range | Purpose | Approved By | Notes / Security Rationale |
| :--- | :--- | :--- | :--- | :--- |
| `express` | `^4.19.2` | HTTP Web Framework | Architecture Team | Minimal HTTP server, standard routing pipeline |
| `cors` | `^2.8.5` | Cross-Origin Resource Sharing | Security Team | Standard CORS middleware |
| `dotenv` | `^16.4.5` | Environment Configuration | Architecture Team | Loads environment variables from `.env` |
| `@prisma/client` | `^5.19.0` | Database Client & ORM | Architecture Team | Strongly typed queries, prevents SQL injection |
| `prisma` | `^5.19.0` | CLI and Migration Tool | Architecture Team | Declarative database schema migrations |
| `argon2` | `^0.40.3` | Password Hashing | Security Team | Memory-hard cryptographic hashing (PHC winner) |
| `jsonwebtoken` | `^9.0.2` | JWT Token Issuance & Verification | Security Team | RFC 7519 standard stateless bearer tokens |
| `slugify` | `^1.6.6` | URL Slug Generation | Architecture Team | Generates URL-safe slugs for article titles |
| `typescript` | `^5.5.3` | Language & Compiler | Architecture Team | Static typing and compilation |
| `jest` | `^29.7.0` | Test Runner & Assertions | Architecture Team | Comprehensive unit and integration test framework |
| `ts-jest` | `^29.1.5` | TypeScript Preprocessor for Jest | Architecture Team | Transpiles TypeScript in Jest runtime |
| `supertest` | `^7.0.0` | HTTP Integration Testing | Architecture Team | Tests Express HTTP endpoints end-to-end |
| `eslint` | `^8.57.0` | Static Code Analysis | Architecture Team | Enforces code quality and formatting |
| `husky` | `^9.0.11` | Git Hook Automation | Architecture Team | Enforces pre-commit and commit-msg quality gates |
| `@commitlint/cli` | `^19.3.0` | Git Commit Message Linter | Architecture Team | Enforces Conventional Commits specification |
| `@stryker-mutator/core`| `^8.4.0` | Mutation Testing Runner | Architecture Team | Measures mutation score indicator (MSI) test adequacy |
