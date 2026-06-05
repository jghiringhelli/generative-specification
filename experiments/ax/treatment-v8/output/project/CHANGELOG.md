# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added
- Initial project setup: TypeScript/Node.js infrastructure for the RealWorld
  Conduit REST API.
- Build tooling: `package.json`, `tsconfig.json` (strict + `noUncheckedIndexedAccess`,
  ES2022, ESM/NodeNext).
- Quality gates: Husky `pre-commit` (typecheck + lint + audit + test) and
  `commit-msg` (commitlint / Conventional Commits) hooks; GitHub Actions CI
  pipeline including `npm audit`, Prisma migrate, Jest coverage, and the Stryker
  mutation gate.
- Testing: Jest configuration with 80% coverage thresholds and global Prisma
  teardown.
- Architecture: repository port interfaces (`IUserRepository`, `IArticleRepository`,
  `ICommentRepository`, `IProfileRepository`) and the `AppError` exception
  hierarchy. Layered ports & adapters (Routes → Services → Domain → Repositories
  → Adapters); in-memory repository fakes for tests/dev, Prisma adapters for prod.
- Documentation: ADR-0001 (stack selection) and ADR-0002 (auth: JWT + argon2),
  approved-packages registry.
- **Auth slice**: `POST /api/users` (register), `POST /api/users/login`,
  `GET /api/user`, `PUT /api/user` — Argon2id hashing, JWT (HS256), Zod
  boundary validation, RealWorld error envelope.
- **Profiles slice**: `GET /api/profiles/:username` (optional auth),
  `POST`/`DELETE /api/profiles/:username/follow` — follow graph + viewer-relative
  `following` flag; `optionalAuthenticate` middleware.
- **Articles & favorites slice**: list/feed/get/create/update/delete plus
  favorite/unfavorite — filters & pagination, author-only mutation (403),
  soft delete, body-less list/feed summaries.
- **Comments slice**: list/add/delete article comments — author-only delete
  (403), newest-first, soft delete.
- **Tags slice**: `GET /api/tags` — derived from live articles (distinct,
  sorted), no separate tag store.

### Changed
- Integration & hardening pass: error-path coverage extended (401/403/404/422),
  including HTTP-controller defensive guards (identity → 401, missing path
  segment → 404), service author-resolution 404 edges, JWT empty-`userId`
  rejection, and the username/image partial-update path. Suite now 211 passing
  (+12), branch coverage 86.5% → 95.3%; HTTP layer at 100%/100%.
- Removed the scaffolded `ITagRepository` port: tags are derived from the
  article aggregate via `IArticleRepository.listTags()`, not a registration store.
