# Conduit Backend

A [RealWorld](https://github.com/gothinkster/realworld) (Conduit) backend built
with **TypeScript 5 + Node 20 + Express 4 + Prisma 5 + PostgreSQL 16**, following
a ports-and-adapters (hexagonal) architecture.

## Architecture

```
Controllers (driving adapters)  -> thin HTTP delegation + validation
Services (business logic)        -> orchestration against port interfaces
Domain types / DTOs              -> pure data contracts
Repository ports (I*Repository)  -> abstract persistence contracts
Prisma repositories (adapters)   -> PostgreSQL I/O
Composition root (container)     -> constructor-injection wiring
```

## Endpoints

- `POST /api/users` — register
- `POST /api/users/login` — login
- `GET /api/user` — current user (auth)
- `PUT /api/user` — update user (auth)
- `GET /api/profiles/:username` — profile
- `POST|DELETE /api/profiles/:username/follow` — follow/unfollow (auth)
- `GET /api/articles` — list (filters: tag, author, favorited; pagination) — no body
- `GET /api/articles/feed` — followed authors' articles (auth) — no body
- `GET /api/articles/:slug` — single article
- `POST /api/articles` — create (auth)
- `PUT|DELETE /api/articles/:slug` — update/delete (auth, author only)
- `POST|DELETE /api/articles/:slug/favorite` — favorite/unfavorite (auth)
- `GET|POST /api/articles/:slug/comments` — list/create comments
- `DELETE /api/articles/:slug/comments/:id` — delete comment (auth, author only)
- `GET /api/tags` — all unique tags

## Scripts

| Script | Purpose |
|---|---|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm test` | Run the Jest test suite |
| `npm run test:coverage` | Run tests with coverage gate |
| `npm run lint` | Lint the source |
| `npm run mutation` | Stryker mutation gate |
| `npm run prisma:migrate` | Apply Prisma migrations |

## Configuration

Copy `.env.example` to `.env` and set values. Required: `DATABASE_URL`,
`JWT_SECRET`. Optional: `JWT_EXPIRY` (default `7d`), `PORT`, `NODE_ENV`.

## Error format

All errors follow the RealWorld shape: `{ "errors": { "body": ["message"] } }`.
