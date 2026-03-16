# Prompt 3 — Articles

Implement articles using the same layered architecture.

- `GET /api/articles` (list with filters: tag, author, favorited; pagination: limit/offset defaults: 20/0)
- `GET /api/articles/feed` (auth required — articles from followed users, same pagination)
- `GET /api/articles/:slug`
- `POST /api/articles` (auth required)
- `PUT /api/articles/:slug` (auth required, author only)
- `DELETE /api/articles/:slug` (auth required, author only)
- `POST /api/articles/:slug/favorite` (auth required)
- `DELETE /api/articles/:slug/favorite` (auth required)

Requirements:
- `GET /api/articles` and `GET /api/articles/feed` must NOT return `body` in article list items (spec change 2024-08-16)
- Slug generated from title (kebab-case + timestamp suffix to ensure uniqueness)
- `articlesCount` field returned alongside `articles` array in list responses
- Pagination defaults: `limit=20`, `offset=0`; both must be validated (non-negative integers)
- Route files must NOT call `prisma.` directly

## Tests to Write Now

- Integration: list articles (no filter), list with tag filter, list with author filter, list with favorited filter, pagination, feed (authenticated), get single article, create article, update article, delete article (403 if not author), favorite/unfavorite
- Include 401 tests for all auth-required endpoints
- Test names describe behavior
