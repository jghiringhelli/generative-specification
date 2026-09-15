# Conduit Backend

A [RealWorld](https://github.com/gothinkster/realworld) (Conduit) backend implemented in
TypeScript with Express, Prisma, and PostgreSQL, following a ports-and-adapters
(hexagonal) architecture.

## Architecture

```
Routes (driving adapters)  → thin: validate + delegate
Services (business logic)  → depend on port interfaces only
Domain types + DTOs        → plain data contracts
Repository ports (I*.ts)   → abstract persistence contracts
Prisma repositories        → driven adapters (PostgreSQL)
Composition root           → src/container.ts wires everything
```

- **Ports** live in `src/repositories/I*.ts` and are owned by the domain.
- **Adapters** are the `Prisma*Repository` classes; tests swap in in-memory fakes.
- **DTOs** in `src/dto` shape responses for the API consumer.
- Errors map to the RealWorld envelope `{ "errors": { "body": ["message"] } }`.

## Endpoints

- `POST /api/users` — register
- `POST /api/users/login` — login
- `GET /api/user` — current user (auth)
- `PUT /api/user` — update user (auth)
- `GET /api/profiles/:username` — profile
- `POST|DELETE /api/profiles/:username/follow` — follow/unfollow (auth)
- `GET /api/articles` — list (filters: tag, author, favorited; pagination; no body)
- `GET /api/articles/feed` — feed of followed authors (auth; no body)
- `GET /api/articles/:slug` — single article (with body)
- `POST /api/articles` — create (auth)
- `PUT|DELETE /api/articles/:slug` — update/delete (auth, author only)
- `POST|DELETE /api/articles/:slug/favorite` — favorite/unfavorite (auth)
- `GET|POST /api/articles/:slug/comments` — list/add comments
- `DELETE /api/articles/:slug/comments/:id` — delete comment (auth, author only)
- `GET /api/tags` — all tags in use

## Scripts

- `npm run build` — compile TypeScript
- `npm test` — run the Jest suite
- `npm run test:coverage` — run tests with coverage gate (80%)
- `npm run lint` — ESLint
- `npm run mutation` — Stryker mutation gate

## Configuration

Copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRY`, and `PORT`.
Configuration is validated at startup (`src/config`) and the app fails fast on missing values.
