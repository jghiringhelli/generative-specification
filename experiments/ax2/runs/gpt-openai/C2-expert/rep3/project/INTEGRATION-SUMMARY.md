# Integration Summary

Static integration review completed without executing the server, per the generation-only harness.

## Endpoints

- `POST /api/users` — 201; validation or duplicate conflicts use 422.
- `POST /api/users/login` — 200; invalid credentials use 422.
- `GET /api/user` — 200; missing or invalid authentication uses 401.
- `PUT /api/user` — 200; missing or invalid authentication uses 401.
- `GET /api/profiles/:username` — 200; missing profiles use 404.
- `POST /api/profiles/:username/follow` — 200; missing authentication uses 401.
- `DELETE /api/profiles/:username/follow` — 200; missing authentication uses 401.
- `GET /api/articles` — 200; invalid pagination uses 422.
- `GET /api/articles/feed` — 200; missing authentication uses 401.
- `GET /api/articles/:slug` — 200; missing articles use 404.
- `POST /api/articles` — 201; missing authentication uses 401.
- `PUT /api/articles/:slug` — 200; non-authors use 403.
- `DELETE /api/articles/:slug` — 204; non-authors use 403.
- `POST /api/articles/:slug/favorite` — 200; missing authentication uses 401.
- `DELETE /api/articles/:slug/favorite` — 200; missing authentication uses 401.
- `GET /api/articles/:slug/comments` — 200; missing articles use 404.
- `POST /api/articles/:slug/comments` — 201; missing authentication uses 401.
- `DELETE /api/articles/:slug/comments/:id` — 204; non-authors use 403.
- `GET /api/tags` — 200.

## Layer and Error Review

All route handlers delegate to services, and no route file directly accesses Prisma. Error responses use the `{"errors":{"body":["message"]}}` shape. Article list, feed, and tag routes were hardened so repository failures also produce the specified error envelope.
