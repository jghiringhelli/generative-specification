# Changelog

All notable changes to the Conduit RealWorld API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project infrastructure: `package.json`, `tsconfig.json`, husky pre-commit and commit-msg hooks, CI/CD pipeline
- Repository port interfaces: `IUserRepository`, `IArticleRepository`, `ICommentRepository`, `IProfileRepository`, `ITagRepository`
- Error class hierarchy: `AppError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `ConflictError`
- Domain type definitions: `User`, `Article`, `Comment`, `UserProfile`, `ArticleFilters`, `Pagination`, `PaginatedArticles` and all input DTOs
- Architecture Decision Records: ADR-0001 (stack: TypeScript + Express + Prisma + PostgreSQL), ADR-0002 (auth: JWT + argon2, bcrypt rejection rationale)
- Approved package registry (`docs/approved-packages.md`) with audit status for all runtime and dev dependencies
- Jest configuration with 80% coverage thresholds and ts-jest transform
- Commitlint conventional commit enforcement
- Pre-commit hooks: `npm audit --audit-level=high`, `tsc --noEmit`, `eslint`, `jest`
- GitHub Actions CI pipeline: security scan, type check, lint, Prisma migrations, Jest coverage, Stryker mutation gate
- `.env.example` with all required environment variable documentation
