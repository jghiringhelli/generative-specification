---
nav_exclude: true
---


All notable changes to the Conduit API project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure with TypeScript, Express, Prisma, PostgreSQL stack
- Husky pre-commit hooks for type checking, linting, testing, and security auditing
- CI/CD pipeline with GitHub Actions including mutation testing gate
- Repository interface contracts for User, Article, Comment, Profile, and Tag domains
- Custom error class hierarchy (AppError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError)
- Dependency approval registry with vulnerability audit requirements
- ADR-0001: Technology stack selection rationale
- ADR-0002: JWT authentication and argon2 password hashing strategy
- Jest test configuration with 80% coverage threshold
- Conventional commits enforcement via commitlint
