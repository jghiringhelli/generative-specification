# Prompt 4 — Comments

Implement comments using the same layered architecture.

- `GET /api/articles/:slug/comments`
- `POST /api/articles/:slug/comments` (auth required)
- `DELETE /api/articles/:slug/comments/:id` (auth required, author only)

Requirements:
- Response shape: `{"comments": [{"id", "createdAt", "updatedAt", "body", "author": {"username", "bio", "image", "following"}}]}`
- Return 404 if article slug not found
- Return 403 if user tries to delete another user's comment
- Route files must NOT call `prisma.` directly

## Tests to Write Now

- Integration: list comments (unauthenticated), add comment (success), delete own comment, delete other user's comment (403), add comment without auth (401), comment on non-existent article (404)
- Test names describe behavior
