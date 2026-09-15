# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project scaffolding and infrastructure configuration.
- TypeScript 5, Express 4, Prisma 5, and PostgreSQL 16 foundation.
- Authentication architecture using Argon2 and JSON Web Tokens.
- Husky pre-commit and commit-msg hooks with Commitlint.
- Continuous Integration workflow with security audit and mutation testing gates.
- Repository pattern interfaces for User, Article, Comment, Profile, and Tag domains.
- Standardized application error hierarchy with consistent JSON responses.
- User profiles domain with follow and unfollow capabilities.
- Articles domain with slug generation, tag filtering, pagination, feed, and favorites.
- Performance optimization: omission of article body in listing and feed responses.
- Comments domain supporting nested article discussions and author-only deletions.
- Tags domain extracting all unique tags associated with published articles.
- Comprehensive unit and integration test suites covering happy paths and error edge cases.
