
# Prompt 3 — Articles

Implement articles:
- GET /api/articles (list, with filters: tag, author, favorited; pagination: limit, offset)
- GET /api/articles/feed (auth required, articles from followed users)
- GET /api/articles/:slug
- POST /api/articles (auth required)
- PUT /api/articles/:slug (auth required, author only)
- DELETE /api/articles/:slug (auth required, author only)
- POST /api/articles/:slug/favorite (auth required)
- DELETE /api/articles/:slug/favorite (auth required)

Note: GET /api/articles and GET /api/articles/feed do NOT return the `body` field in list responses (performance spec change from 2024-08-16).

Write tests for all endpoints including authorization checks, pagination, and filtering.

---
**Before committing:** run the Verification Protocol (see CLAUDE.md § Verification Protocol).
All 7 steps must pass. Do not commit a partial green state.
