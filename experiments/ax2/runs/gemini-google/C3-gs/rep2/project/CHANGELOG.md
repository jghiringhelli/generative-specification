# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with TypeScript 5, Express 4, Prisma 5, and PostgreSQL 16.
- Strict compiler configurations (`strict: true`, `target: ES2022`, `esModuleInterop: true`).
- Git hooks via Husky (`pre-commit` and `commit-msg`) enforcing compilation, linting, security audit, test gates, and conventional commits.
- Full Continuous Integration (CI) pipeline including audit, type checking, linting, database migrations, Jest coverage threshold checks, and Stryker mutation testing.
- Architecture Decision Records: ADR-0001 (Stack Selection) and ADR-0002 (Authentication and Password Hashing).
- Core repository contracts (`IUserRepository`, `IProfileRepository`, `IArticleRepository`, `ICommentRepository`, `ITagRepository`).
- Domain error handling hierarchy (`AppError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `ConflictError`).
- Dependency governance registry in `docs/approved-packages.md`.
