# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added
- Initial project setup: TypeScript 5 + Node 20 + Express 4 + Prisma 5 + PostgreSQL 16.
- Infrastructure scaffolding: tsconfig, husky commit hooks, commitlint, CI pipeline
  with security audit, type-check, lint, Prisma migrate, Jest coverage, and Stryker
  mutation gate.
- Architecture Decision Records ADR-0001 (stack) and ADR-0002 (auth).
- Repository port interfaces and base error hierarchy.
