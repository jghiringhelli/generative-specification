# Conduit Backend (RealWorld)

A RealWorld / Conduit backend implemented in TypeScript + Express + Prisma/PostgreSQL,
following a layered (ports & adapters) architecture:

```
routes  →  services  →  repositories  →  Prisma/PostgreSQL
```

- **Routes** (driving adapters): validate input with Zod and delegate to services.
  They never call `prisma.` directly.
- **Services**: business logic and orchestration. Depend on repositories.
- **Repositories** (driven adapters): the only layer that touches Prisma.

## Setup

```bash
npm install
cp .env.example .env        # set DATABASE_URL, JWT_SECRET, PORT
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Endpoints

### Auth / User
- `POST /api/users` — register
- `POST /api/users/login` — login
- `GET /api/user` — current user (auth)
- `PUT /api/user` — update user (auth)

### Profiles
- `GET /api/profiles/:username`
- `POST /api/profiles/:username/follow` (auth)
- `DELETE /api/profiles/:username/follow` (auth)

### Articles
- `GET /api/articles` — list (filters: tag, author, favorited; limit/offset)
- `GET /api/articles/feed` (auth)
- `GET /api/articles/:slug`
- `POST /api/articles` (auth)
- `PUT /api/articles/:slug` (auth, author only)
- `DELETE /api/articles/:slug` (auth, author only)
- `POST /api/articles/:slug/favorite` (auth)
- `DELETE /api/articles/:slug/favorite` (auth)

### Comments
- `GET /api/articles/:slug/comments`
- `POST /api/articles/:slug/comments` (auth)
- `DELETE /api/articles/:slug/comments/:id` (auth, author only)

### Tags
- `GET /api/tags`

## Errors

All errors use the RealWorld format:

```json
{ "errors": { "body": ["message"] } }
```

Validation failures return HTTP 422, missing/invalid auth 401, forbidden 403,
and not-found 404.

## Tests

```bash
npm test              # run unit + integration suites
npm run test:coverage # with coverage (threshold: 80% lines)
```

Integration tests run with Supertest against a real PostgreSQL test database
(set `DATABASE_URL` to a disposable test database before running).
