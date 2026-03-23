# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project infrastructure: TypeScript 5, Express 4, Prisma 5, PostgreSQL 16
- Repository interface definitions: IUserRepository, IArticleRepository, ICommentRepository, IProfileRepository, ITagRepository
- AppError hierarchy: AppError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError
- Husky pre-commit hooks: tsc, lint, npm audit, test gate
- GitHub Actions CI pipeline with PostgreSQL service, tsc, lint, coverage, and Stryker mutation gate
- ADR-0001: Stack selection (TypeScript + Node + Express + Prisma + PostgreSQL)
- ADR-0002: Authentication strategy (JWT + argon2)
- Approved package registry
- ESLint configuration with @typescript-eslint rules
- Stryker mutation testing configuration
- Authentication endpoints: POST /api/users, POST /api/users/login, GET /api/user, PUT /api/user
- Profile endpoints: GET /api/profiles/:username, POST/DELETE /api/profiles/:username/follow
- Article endpoints: full CRUD + favorite/unfavorite + list + feed
- Comment endpoints: GET/POST /api/articles/:slug/comments, DELETE /api/articles/:slug/comments/:id
- Tag endpoint: GET /api/tags
