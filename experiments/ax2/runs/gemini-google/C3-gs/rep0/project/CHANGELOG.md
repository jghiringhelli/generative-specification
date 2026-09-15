# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project infrastructure setup including TypeScript, Express, Prisma, testing, and CI configuration.
- Base architectural documentation and decision records (ADR-0001, ADR-0002).
- Core error handling hierarchy and repository interfaces.
- Authentication module with Argon2 password hashing, JWT stateless token issuance, and endpoints (`/api/users`, `/api/users/login`, `/api/user`).
- Profile module with following/unfollowing capabilities and endpoints (`/api/profiles/:username`, `/api/profiles/:username/follow`).
- Article publishing module with tagging, author filtering, favoriting, feed generation, and body-omission in list responses (`/api/articles`, `/api/articles/feed`, `/api/articles/:slug`).
- Comment management module with article associations and author-gated deletion (`/api/articles/:slug/comments`, `/api/articles/:slug/comments/:id`).
- Tag discovery endpoint returning all distinct tags associated with articles (`/api/tags`).
- Comprehensive unit and integration test suites covering happy paths, auth gates, and edge cases (401, 403, 404, 422).
