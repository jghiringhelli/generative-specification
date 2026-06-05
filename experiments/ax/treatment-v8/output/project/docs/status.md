# project — Status

> Last updated: 2026-06-05
> Update this file at the end of each session.

## Completed (this session)

- **Behavioral contracts documented** (`docs/use-cases.md`): replaced the generic
  scaffold with 8 use cases — one per endpoint group (UC-001 registration/login,
  UC-002 current user, UC-003 profiles+follow, UC-004 articles CRUD, UC-005
  feed+pagination, UC-006 favorites, UC-007 comments, UC-008 tags) — each with
  Actor / Precondition / Steps / Postcondition / Error Cases and machine-checkable
  Acceptance Criteria (AC-NNN.M). Derived from the shipped `src/http` + `src/services`
  behavior and cross-checked against the Hurl conformance suite (13/13). Captures the
  post-conformance contract: **DELETE article/comment → `204` empty body** (the
  `bf9beff` conformance fix superseded the earlier `200 {}`); follow/unfollow and
  favorite/unfavorite → `200` idempotent; login failure → `401`
  `{ errors: { credentials: ['invalid'] } }`; list/feed omit `body`.

- **Integration & hardening pass** (final pre-release gate). All 7 GS properties
  re-verified against the real `.husky/pre-commit` gate: `tsc --noEmit` (0),
  `eslint` (0), `npm audit --audit-level=high` (0 high; 4 moderate dev-only),
  `jest --coverage` (**211 passed**, 4 DB-gated skipped), `tsc` build emits.
  - **Layering audit (Composable)**: confirmed no `src/http` production module
    imports a repository or `@prisma/client` — every handler delegates to a
    service. Routes mention Prisma only in docstrings.
  - **Error envelope (api.md)**: all `AppError`s map to `{ errors: { body:[…] } }`;
    `ValidationError` → `422` with field-keyed messages (envelope prefix stripped).
  - **Error-path coverage** added for the remaining reachable edges: service
    author-resolution `404` (`ArticleService`/`CommentService.resolveAuthor`),
    JWT empty-`userId` rejection, username/image partial-update branch, and the
    HTTP-controller defensive guards (identity → `401`, missing path segment →
    `404`) via `src/http/controllerGuards.test.ts`. Branch coverage **86.5% →
    95.3%**; HTTP layer **100%/100%**; services branch **97.1%**.
  - `.forgecraft/gate-violations.jsonl` (generated tooling log) added to
    `.gitignore`; `CHANGELOG.md` updated with the delivered feature slices.
- **Tags vertical slice** (RealWorld tag contract): `GET /api/tags` (no auth)
  returns `{ tags }` — the distinct, de-duplicated, alphabetically-sorted set of
  tags appearing on any **non-deleted** article.
  - **Derived from the article aggregate, no tag store**: new
    `IArticleRepository.listTags()` (distinct union over live articles),
    implemented in `InMemoryArticleRepository` + `PrismaArticleRepository`;
    `ArticleService.listTags()` exposes it; new thin `TagController`/`tagRoutes`/
    `tagPresenter` slice wired at `src/http/app.ts` (reuses the already-injected
    `articleService`, so `server.ts` is unchanged).
  - **Removed the scaffolded `ITagRepository` port** (separate `listAll()`/
    `ensure()` registration store): its registration model contradicts "tags
    that appear on any article" — registered tags would outlive their last
    (soft-)deleted article. Spec decision record: `docs/specs/tags.md`. No new
    ADR (reuses ADR-0002 layering); no schema change (`tagList` already on
    `Article`).
  - Verification gate green: `tsc --noEmit` (0), `eslint` (0), `npm audit
    --audit-level=high` (0 high), `jest --coverage` (199 passed, 4 DB-gated
    skipped; new tag files 100%, ≥80%/80% gate met), `tsc` build emits.
- **Comments vertical slice** (RealWorld comment contract): `GET
  /api/articles/:slug/comments` (optional auth), `POST
  /api/articles/:slug/comments` (auth, `201`), and `DELETE
  /api/articles/:slug/comments/:id` (auth, **author-only → 403**).
  - New `CommentService` over `ICommentRepository` + `IArticleRepository`
    (resolve slug → article id, `404`) + `IUserRepository` (embed author) +
    `IProfileRepository` (author `following`); `InMemoryCommentRepository` fake
    for tests/dev and `PrismaCommentRepository` for prod, wired at
    `src/server.ts`. New `commentRoutes`/`CommentController`/`commentSchemas`/
    `commentPresenter`; `'comment'` added to `validation.ts` envelope keys so
    field errors stay flat (`body`, not `comment.body`).
  - `Comment` model added to the Prisma schema (`deletedAt` **soft delete** per
    Tier 3, mirroring articles; cascade FKs to article + author); client
    regenerated and `PrismaCommentRepository` excluded from the coverage
    denominator. Comments list **newest first**.
  - Spec decision record: `docs/specs/comments.md`; `data-model.md` extended
    with the Comment entity and ERD. No new ADR (reuses ADR-0002 layering +
    the article soft-delete decision).
  - Verification gate green: `tsc --noEmit` (0), `eslint` (0), `npm audit
    --audit-level=high` (0 high), `jest --coverage` (192 passed, 4 DB-gated
    skipped; 96.96% stmts / 86.47% branch, ≥80%/80% gate met), `tsc` build emits.
- **Articles vertical slice** (RealWorld article + favorites contract): `GET
  /api/articles` (optional auth; filters tag/author/favorited + limit/offset
  pagination), `GET /api/articles/feed` (auth; followed authors), `GET
  /api/articles/:slug` (optional auth), `POST /api/articles` (auth, `201`),
  `PUT`/`DELETE /api/articles/:slug` (auth, **author-only → 403**), and
  `POST`/`DELETE /api/articles/:slug/favorite` (auth, idempotent).
  - New `ArticleService` over `IArticleRepository` + `IUserRepository`
    (resolve filter usernames → ids) + `IProfileRepository` (author `following`
    + feed author ids); `InMemoryArticleRepository` fake for tests/dev and
    `PrismaArticleRepository` for prod, wired at `src/server.ts`.
  - `Article` + `ArticleFavorite` models added to the Prisma schema
    (`favoritesCount` derived via `_count`; `deletedAt` soft delete); client
    regenerated. Scaffolded `IArticleRepository` port refined so filters/feed
    take **ids**, keeping the adapter ignorant of users/follows. Shared
    boundary-validation `parseOrThrow` extracted to `src/http/validation.ts`.
  - **List/feed omit the `body` field** (2024-08-16 performance spec); the
    presenter splits a body-less summary from the full article.
  - Spec decision record: `docs/specs/articles.md`; `data-model.md` extended
    with Article + ArticleFavorite entities and ERD. No new ADR (reuses
    ADR-0002 layering).
  - Verification gate green: `tsc --noEmit` (0), `eslint` (0), `npm audit
    --audit-level=high` (0 high), `jest --coverage` (164 passed, 4 DB-gated
    skipped; 97.3% stmts / 87.0% branch, ≥80%/80% gate met), `tsc` build emits.
- **User profiles vertical slice** (RealWorld profile contract): `GET
  /api/profiles/:username` (optional auth), `POST /api/profiles/:username/follow`
  and `DELETE .../follow` (auth required).
  - New `ProfileService` over `IUserRepository` (resolve username) +
    `IProfileRepository` (follow graph); `InMemoryProfileRepository` fake for
    tests/dev and `PrismaProfileRepository` for prod, wired at `src/server.ts`.
  - `Follow` model added to the Prisma schema (composite PK, cascade delete);
    client regenerated. `optionalAuthenticate` middleware added (shares
    `readBearerToken` with `authenticate`) so the public GET reflects a known
    viewer's `following` flag without rejecting anonymous/invalid tokens.
  - Spec decision record: `docs/specs/profiles.md`; `data-model.md` populated
    with User + Follow entities and ERD. No new ADR (reuses ADR-0002 layering).
  - Verification gate green: `tsc --noEmit` (0), `eslint` (0), `npm audit
    --audit-level=high` (0 high), `jest --coverage` (96 passed, 4 DB-gated
    skipped; 97.5% stmts / 85.7% branch, ≥80%/70% gate met).
- **User authentication vertical slice** (RealWorld user contract): `POST /api/users`
  (register), `POST /api/users/login`, `GET /api/user`, `PUT /api/user`.
  - Layered ports & adapters: `UserService` over `IUserRepository` /
    `IPasswordHasher` (Argon2id) / `ITokenService` (JWT HS256); wired at
    `src/server.ts`. Prisma `User` model + `PrismaUserRepository` for prod;
    `InMemoryUserRepository` fake for tests/dev.
  - Zod validation at the boundary, `AppError` → RealWorld error-envelope middleware,
    `authenticate` middleware (`Token`/`Bearer`).
  - 66 tests pass (4 DB tests skipped — see below). Coverage 97.8% stmts / 85.7% branch.
- Verification gates green: `tsc --noEmit` (0 errors), `eslint` (0), `npm audit
  --audit-level=high` (0 high), `jest --coverage` (≥80% gate met), `tsc` build emits.
- Spec decision record: `docs/specs/auth.md`. Pitfalls documented in
  `.claude/standards/protocols.md` § Known Pitfalls (jsonwebtoken `expiresIn` cast +
  CommonJS default import).

## In Progress

- (none)

## Next

- Provision Postgres (`docker compose` on port 5453 per `.env`) and run the real-DB
  suite with `RUN_DB_TESTS=1` + `prisma db push` (now also covers `follows`,
  `articles`, `article_favorites`, and `comments` — add
  `PrismaProfileRepository.test.ts`, `PrismaArticleRepository.test.ts`, and
  `PrismaCommentRepository.test.ts` under the same gate).

## Decisions Made (this session)

- **Tags** (see `docs/specs/tags.md`): `GET /api/tags` → `200 { tags }`, no auth;
  tags are **derived** from live articles (distinct, sorted), not a separate
  store — so a tag drops out when its only article is soft-deleted. The
  scaffolded `ITagRepository` (registration model) was removed as incompatible
  with that requirement; `IArticleRepository.listTags()` is the source instead.

- **Status codes** (see `docs/specs/auth.md`): register `201`; duplicate → `409`
  (`ConflictError`, per `AppError.ts`'s documented purpose); bad creds → `401`.
  RealWorld reference servers sometimes use `200`/`422` here — flagged for revisit if a
  conformance suite asserts otherwise.
- **`tmp@^0.2.7` npm override** to clear a transitive HIGH CVE from the dev-only stryker
  chain without a breaking major bump (`docs/approved-packages.md` § Transitive Overrides).
- **Articles** (see `docs/specs/articles.md`): create → `201`, others → `200`,
  DELETE → `200 {}`; author-only update/delete → `403` (enforced in the service,
  not the route); unknown slug → `404`; a filter naming an unknown user → empty
  page (not `404`); `articlesCount` is the pre-pagination total. **Soft delete**
  (`deletedAt` + read-time filtering) reconciles the RealWorld hard-`DELETE`
  contract with operation-classification Tier 3 ("no hard delete of domain
  entities"). List/feed omit `body` per the 2024-08-16 performance change.
- **Comments** (see `docs/specs/comments.md`): create → `201`, list → `200`,
  DELETE → `200 {}`; author-only delete → `403` (enforced in the service);
  unknown slug or comment id → `404` (a comment under a mismatched article slug
  is also `404`). **Soft delete** (`deletedAt` + read-time filtering) reuses the
  article Tier-3 decision. List is newest-first; the embedded author `following`
  flag is viewer-relative via the same `IProfileRepository.isFollowing`.
- **Profiles** (see `docs/specs/profiles.md`): all three endpoints succeed with `200`;
  unknown username → `404`; follow/unfollow idempotent. GET uses *optional* auth — a
  missing/malformed/invalid token serves the anonymous view (no `401`), matching the
  RealWorld `auth.optional` semantics. Self-follow is not special-cased.

## Assumptions (recorded per Clarification Protocol — clarifying question was dismissed)

- **Integration tests run over the in-memory repository fake** (a Fake, endorsed by
  `testing.md`; not a mock), because no Postgres is reachable in this environment
  (port 5453 refused, Docker daemon down). The real-DB adapter is shipped and covered by
  a gated test. Re-run that test where a DB exists to fully satisfy the "real DB
  integration" standard.

## Blockers / Dependencies

- No Postgres available locally → real-DB integration test (`PrismaUserRepository.test.ts`)
  is skipped until `RUN_DB_TESTS=1` with a reachable database.

## Note on prompt references (doc drift)

The task referenced "CLAUDE.md § Known Type Pitfalls" and "§ Verification Protocol (7
steps)", which do not exist verbatim. Mapped to the real artifacts: the JWT cast is now a
real entry in `protocols.md` § Known Pitfalls; verification was run against the actual
pre-commit gate (typecheck → lint → audit → coverage) and the constitution's 7 GS
Properties. Consider adding an explicit "Verification Protocol" section to CLAUDE.md to
remove the ambiguity.
