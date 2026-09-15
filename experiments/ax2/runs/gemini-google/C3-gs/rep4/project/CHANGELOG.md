# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project infrastructure setup with TypeScript 5, Express 4, Prisma 5, and PostgreSQL 16.
- Enforced verification protocol, commitlint, and husky git hooks.
- Base error classes, repository interfaces, and test configuration.
- Prompt 1: User authentication with Argon2 hashing and JWT token management (register, login, get user, update user).
- Prompt 2: User profile handling with follow/unfollow capabilities and following state resolution.
- Prompt 3: Articles functionality with CRUD, slug generation, favorites, tags, author feeds, and list responses omitting body for performance.
- Prompt 4: Comments management for articles with author-only deletion safeguards.
- Prompt 5: Tags endpoint returning all unique tags present across articles.
- Prompt 6: Layer decoupling audit and comprehensive test coverage for unit and integration testing.

