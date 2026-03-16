# Prompt 5 — Tags

Implement tags.

- `GET /api/tags`

Requirements:
- Returns all unique tag strings across all articles: `{"tags": ["str1", "str2", ...]}`
- When creating/updating an article via `POST /api/articles` and `PUT /api/articles/:slug`,
  the `tagList` field in the request body must be persisted and returned in article responses.
- Tags in `GET /api/articles` filter (`?tag=...`) must work against the persisted tags.

## Tests to Write Now

- Integration: list tags when no articles exist (empty array), list tags after articles created, tags filter in `GET /api/articles`
