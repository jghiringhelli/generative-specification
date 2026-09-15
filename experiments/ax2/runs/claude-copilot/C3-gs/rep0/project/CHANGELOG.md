# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added
- Initial project setup: TypeScript 5 + Node 20 + Express 4 + Prisma 5 + PostgreSQL 16.
- Infrastructure scaffolding: build/test/lint scripts, husky commit hooks, commitlint gate.
- CI pipeline with security audit, type-check, lint, Prisma migrate, Jest coverage, and Stryker mutation gate.
- Architecture decision records ADR-0001 (stack) and ADR-0002 (auth).
- Repository port interfaces and base error hierarchy.
- Authentication: register, login, get current user, update user (JWT + argon2).
- Profiles: view profile, follow, unfollow.
- Articles: list (with tag/author/favorited filters and pagination), feed, get, create,
  update (author-only), delete (author-only), favorite, unfavorite. List/feed responses
  omit the `body` field (performance spec change 2024-08-16).
- Comments: list, add, delete (author-only).
- Tags: list all unique tags appearing on articles.

### Hardening
- Verified every route handler delegates to a service (no direct DB access in routes).
- Confirmed all error responses use the Conduit format `{ "errors": { "body": ["message"] } }`.
- Added edge-case coverage for 401, 403, 404, and 422 paths across services and endpoints.
