# Spec Decision Record — Comments

> Feature spec for the comment vertical slice. Derives from `docs/PRD.md`
> (comments) and reuses the ports & adapters decision of
> `docs/adrs/ADR-0002-auth.md` and the soft-delete decision of
> `docs/specs/articles.md`. Conforms to the RealWorld Conduit API comment
> contract.

## Endpoints

| Method | Path | Auth | Success |
| --- | --- | --- | --- |
| GET | `/api/articles/:slug/comments` | optional | `200` |
| POST | `/api/articles/:slug/comments` | required | `201` |
| DELETE | `/api/articles/:slug/comments/:id` | required (author) | `200` (`{}`) |

`Authorization: Token <jwt>` is the RealWorld scheme; `Bearer` is also accepted.

## Behaviour

- **Comments are scoped to an article.** Every endpoint first resolves the
  `:slug` to a live (non-soft-deleted) article; an unknown slug → `404`.
- **List order is newest first**, matching the recency convention used across
  the API. The list carries each comment's **embedded author** (`username`,
  `bio`, `image`, `following`), where `following` reflects the *viewing* user's
  follow edge (`false` when anonymous), reusing the same
  `IProfileRepository.isFollowing` the profile and article slices use.
- **Create** wraps the payload in a top-level `comment` object (`{ comment: {
  body } }`); a blank/whitespace `body` → `422` with a field error. The created
  comment echoes back with its author and timestamps.
- **Delete is author-only.** The *service* compares the comment's `authorId` to
  the caller, so the rule holds regardless of transport; a non-author → `403`.
  The comment must also belong to the named article, otherwise `404`.

## Status code & authorization decisions

Following the codebase's error taxonomy (`src/errors/AppError.ts`) and the
precedent in `docs/specs/articles.md`:

- **Create → `201`**; list → `200`; delete → `200 {}`.
- **Unknown `:slug` or `:id` → `404`** (`NotFoundError`, resource `Article` /
  `Comment`). A comment whose article does not match the slug is also `404`
  (it is not addressable under that path).
- **Auth at the router seam**: `authenticate` on create/delete;
  `optionalAuthenticate` on the public list so its embedded `following` flag can
  reflect a known caller. Auth is never checked inside handlers
  (`.claude/standards/api.md`).
- **Author-only delete → `403`** (`ForbiddenError`): enforced in the service.
- **Validation → `422`** with field errors, via Zod at the boundary
  (`commentSchemas.ts` + the shared `validation.ts` helper).

## The soft-delete decision (operation-classification Tier 3)

`docs/operation-classification.md` classes *hard delete of domain entities* as
Tier 3 ("use soft delete + audit log instead"). The PRD requires a working
`DELETE` whose comment disappears from subsequent reads. As with articles, we
reconcile the two with a **soft delete**: `delete` sets `deletedAt`, and every
read path (`findById`, `listByArticle`) filters `deletedAt: null`. The
observable RealWorld behaviour (gone on re-list) is identical while the row is
retained — no hard delete, scoped by a specific id (never an unscoped `DELETE`).
The in-memory fake mirrors this exclusion contract.

## Architecture (ports & adapters)

```
HTTP (commentRoutes/CommentController)  →  CommentService  →  ports
  · optionalAuthenticate (list)                              ├─ ICommentRepository → Prisma / InMemory
  · authenticate (create, delete)                            ├─ IArticleRepository → resolve slug → article id (404)
                                                             ├─ IUserRepository    → embed author profile
                                                             └─ IProfileRepository → author `following`
```

No new ADR is raised: this slice reuses ADR-0002's layering and injection
pattern and the article slice's soft-delete decision. The pre-scaffolded
`ICommentRepository` port was used as-is; the comment adapter references the
author by **id** and stays ignorant of users and the follow graph, exactly as
the article adapter does. The shared boundary-validation helper `parseOrThrow`
(`src/http/validation.ts`) is reused.

## Test strategy

- **Unit**: `InMemoryCommentRepository` (per-article scoping, newest-first
  ordering, find-by-id, soft-delete exclusion); `CommentService` (article
  resolution incl. unknown-slug 404, listing order, author-only delete,
  article/comment ownership mismatch, viewer-relative `following`).
- **Integration (subcutaneous)**: Supertest against the real Express app over
  the in-memory fakes — all three endpoints, 401/403/404/422 paths, ordering,
  and the viewer-relative `following` flag.
- **Integration (real DB)**: `PrismaCommentRepository` is verified by the gated
  real-database suite (`RUN_DB_TESTS=1`) and excluded from the unit-coverage
  denominator, exactly as the other Prisma adapters are.
