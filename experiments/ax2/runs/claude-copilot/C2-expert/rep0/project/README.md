# Conduit Backend (RealWorld)

TypeScript + Express + Prisma/PostgreSQL implementation of the
[RealWorld](https://github.com/gothinkster/realworld) ("Conduit") API spec.

## Layered Architecture

Requests flow strictly inward; dependencies point inward only:

```
routes  →  services  →  repositories  →  Prisma/PostgreSQL
(HTTP)     (business)    (persistence)
```

- **routes/** — thin driving adapters. Parse the request, delegate to a service,
  serialize the result. They NEVER import or call `prisma` directly.
- **services/** — business logic and orchestration. Depend on repositories and
  domain utilities only. Validate input with Zod, raise typed domain errors.
- **repositories/** — driven adapters. The only layer that touches Prisma.
- **middleware/** — auth (JWT) and the error handler that maps domain errors to
  the RealWorld envelope `{ "errors": { "body": ["..."] } }`.
- **container.ts** — composition root wiring concrete repositories into services.

## Setup

```bash
npm install
cp .env.example .env      # set DATABASE_URL, JWT_SECRET, PORT
npx prisma migrate dev
npm run dev
```

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/users` | – | Register |
| POST | `/api/users/login` | – | Login |
| GET | `/api/user` | required | Current user |
| PUT | `/api/user` | required | Update user |
| GET | `/api/profiles/:username` | optional | View profile |
| POST | `/api/profiles/:username/follow` | required | Follow |
| DELETE | `/api/profiles/:username/follow` | required | Unfollow |
| GET | `/api/articles` | optional | List articles (filters + pagination) |
| GET | `/api/articles/feed` | required | Feed of followed authors |
| GET | `/api/articles/:slug` | optional | Single article |
| POST | `/api/articles` | required | Create article |
| PUT | `/api/articles/:slug` | required (author) | Update article |
| DELETE | `/api/articles/:slug` | required (author) | Delete article |
| POST | `/api/articles/:slug/favorite` | required | Favorite |
| DELETE | `/api/articles/:slug/favorite` | required | Unfavorite |
| GET | `/api/articles/:slug/comments` | optional | List comments |
| POST | `/api/articles/:slug/comments` | required | Add comment |
| DELETE | `/api/articles/:slug/comments/:id` | required (author) | Delete comment |
| GET | `/api/tags` | – | List all tags |

Notes:
- `GET /api/articles` and `/api/articles/feed` omit `body` from list items
  (spec change 2024-08-16) and return `articlesCount` alongside `articles`.
- Slugs are kebab-case from the title with a timestamp suffix for uniqueness.
- Follow/unfollow and favorite/unfavorite are idempotent.
- Pagination defaults: `limit=20`, `offset=0`; both validated as non-negative
  integers (HTTP 422 otherwise).

## Integration & Hardening Summary (Prompt 6)

- **Layer compliance:** a search for `prisma.` across `src/routes` and
  `src/services` returns zero matches — only repositories access Prisma. No
  layer violations were found; no fixes were required.
- **Delegation:** every route handler delegates to a service method and only
  performs request parsing / response shaping.
- **Error envelope:** all domain errors extend `AppError` and are converted by
  the central `errorHandler` to `{ "errors": { "body": ["message"] } }` with the
  correct status (401/403/404/422; 500 fallback). Unmatched routes return 404 in
  the same envelope.
- **Status codes:** 201 for create (users, articles, comments), 200 for reads
  and mutations, 401/403/404/422 for the corresponding error paths.

## Test Summary (Prompt 7)

Unit tests (`tests/unit/`):
- `password.test.ts` — hash/verify round-trip and rejection.
- `token.test.ts` — sign/verify round-trip, wrong-secret failure, 30-day expiry.
- `slug.test.ts` — kebab-case, uniqueness, punctuation, empty-title fallback.
- `pagination.test.ts` — defaults, parsing, validation errors.

Integration tests (`tests/integration/`, Supertest against a real test DB):
- `auth.test.ts` — register/login/get/update plus 422 (duplicate email, invalid
  email, wrong password) and 401 (no token).
- `profiles.test.ts` — view (auth/unauth), follow/unfollow idempotency, 404, 401.
- `articles.test.ts` — list (no filter / tag / author / favorited), pagination,
  feed, single, create/update/delete, favorite/unfavorite, plus 401/403/404/422.
- `comments.test.ts` — list, add, delete own, 403 (other user), 401, 404.
- `tags.test.ts` — empty, populated unique set, tag filter on list.

Coverage gate: `jest.config.ts` enforces 80% line coverage.
