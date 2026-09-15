# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project infrastructure setup: TypeScript 5, Express 4, Prisma 5, and PostgreSQL 16.
- Repository interfaces for User, Article, Comment, Profile, and Tag domains.
- Domain error hierarchy for standardized HTTP error mapping.
- Husky pre-commit and commit-msg hooks enforcing commitlint, linting, typechecking, and tests.
- GitHub Actions CI workflow with high-severity audit, coverage, and mutation testing gates.
- ADR-0001 (Core Technology Stack) and ADR-0002 (Authentication and Password Hashing Strategy).
- Approved package dependency registry.
