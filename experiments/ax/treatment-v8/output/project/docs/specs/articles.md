# Spec Decision Record — Articles & Favorites

> Feature spec for the article vertical slice. Derives from `docs/PRD.md`
> (articles, favorites) and reuses the ports & adapters decision of
> `docs/adrs/ADR-0002-auth.md`. Conforms to the RealWorld Conduit API article
> contract, with one deliberate performance deviation (list/feed omit `body`).

## Endpoints

| Method | Path | Auth | Success | Body in list/feed |
| --- | --- | --- | --- | --- |
| GET | `/api/articles` | optional | `200` | **omitted** |
| GET | `/api/articles/feed` | required | `200` | **omitted** |
| GET | `/api/articles/:slug` | optional | `200` | included |
| POST | `/api/articles` | required | `201` | included |
| PUT | `/api/articles/:slug` | required (author) | `200` | included |
| DELETE | `/api/articles/:slug` | required (author) | `200` | — (`{}`) |
| POST | `/api/articles/:slug/favorite` | required | `200` | included |
| DELETE | `/api/articles/:slug/favorite` | required | `200` | included |

`Authorization: Token <jwt>` is the RealWorld scheme; `Bearer` is also accepted.

## Behaviour

- **List/feed omit `body`** (performance spec change, 2024-08-16). The single
  presenter splits a body-less *summary* from the full *article*; only the
  single-article, create, update, and favorite envelopes carry `body`.
- **`favorited`** reflects whether the *viewing* user has favorited the article
  (`false` when anonymous); **`favoritesCount`** is derived from the favorites
  graph, never stored. **`author.following`** reflects the viewer's follow edge,
  reusing the same `IProfileRepository.isFollowing` the profile slice uses.
- **Filters** (`tag`, `author`, `favorited`) and **pagination** (`limit`
  default 20, max 100; `offset` default 0) apply to `GET /api/articles`. The
  service resolves the `author`/`favorited` usernames to ids; a filter naming a
  user who does not exist yields an **empty page**, not a 404 (RealWorld
  semantics). `articlesCount` is the total matching count *before* pagination.
- **Feed** returns articles authored by the users the viewer follows, newest
  first. The service resolves the followed ids via `IProfileRepository` and
  passes them to the article port, which therefore never touches the follow
  graph.
- **Slugs** are derived from the title (`slugify`: lower-cased, accent-stripped,
  hyphenated). On collision a short suffix is appended, so the slug is unique.
  Changing the title on update re-derives the slug.
- **Favorite / unfavorite are idempotent**, mirroring follow/unfollow.

## Status code & authorization decisions

Following the codebase's error taxonomy (`src/errors/AppError.ts`) and the
precedent in `docs/specs/auth.md` / `docs/specs/profiles.md`:

- **Create → `201`**; all other successes → `200` (favorite is an idempotent
  state assertion, not a fresh resource). DELETE returns `200 {}`.
- **Unknown `:slug` → `404`** (`NotFoundError`, resource `Article`).
- **Auth at the router seam**: `authenticate` on create/update/delete/feed/
  favorite; `optionalAuthenticate` on the public reads so their
  `favorited`/`following` flags can reflect a known caller. Auth is never
  checked inside handlers (`.claude/standards/api.md`).
- **Author-only mutation → `403`** (`ForbiddenError`): the *service* compares
  `article.authorId` to the caller, so the rule holds regardless of transport.
- **Validation → `422`** with field errors, via Zod at the boundary
  (`articleSchemas.ts` + the shared `validation.ts` helper).

## The soft-delete decision (operation-classification Tier 3)

`docs/operation-classification.md` classes *hard delete of domain entities* as
Tier 3 ("use soft delete + audit log instead"). The PRD requires a working
`DELETE /api/articles/:slug` whose article disappears from subsequent reads. We
reconcile the two with a **soft delete**: `delete` sets `deletedAt`, and every
read path (`findBySlug`, `list`, `feed`) filters `deletedAt: null`. The
observable RealWorld behaviour (gone, 404 on re-GET) is identical, while the row
is retained — no hard delete, scoped by a specific slug (never an unscoped
`DELETE`). The in-memory fake mirrors this exclusion contract.

## Architecture (ports & adapters)

```
HTTP (articleRoutes/ArticleController)  →  ArticleService  →  ports
  · optionalAuthenticate (list, get)                         ├─ IArticleRepository → Prisma / InMemory
  · authenticate (feed, create, update, delete, favorite)    ├─ IUserRepository    → resolve author/favoriter usernames → ids
                                                             └─ IProfileRepository → author `following` + feed author ids
```

No new ADR is raised: this slice reuses ADR-0002's layering and injection
pattern. The scaffolded `IArticleRepository` port was refined so filters/feed
arrive as **ids** (not usernames) — keeping the article adapter ignorant of
users and the follow graph (no lateral coupling between adapters); username →
id resolution is the service's job. The shared boundary-validation helper
`parseOrThrow` was extracted to a domain-neutral `src/http/validation.ts` so the
article and user schema modules reuse it without a lateral cross-domain import.

## Test strategy

- **Unit**: `slugify` (pure); `InMemoryArticleRepository` (ordering, filters,
  pagination total, derived count, idempotent favorite, soft-delete exclusion);
  `ArticleService` (slug derivation/uniqueness, author-only mutation, filter
  resolution incl. unknown-user empty page, feed, favoriting, viewer-relative
  flags).
- **Integration (subcutaneous)**: Supertest against the real Express app over
  the in-memory fakes — all eight endpoints, 401/403/404/422 paths, pagination,
  filtering, and the `body`-omission contract on list & feed.
- **Integration (real DB)**: `PrismaArticleRepository` is verified by the gated
  real-database suite (`RUN_DB_TESTS=1`) and excluded from the unit-coverage
  denominator, exactly as the other Prisma adapters are.
- Coverage after this slice: 97.3% stmts / 87.0% branch (gate 80% / 80%).
