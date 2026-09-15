# Conduit Backend (RealWorld)

TypeScript + Express + Prisma/PostgreSQL implementation of the RealWorld
Conduit API.

## Layered Architecture

Requests flow strictly inward through three layers per feature:

```
routes  →  services  →  repositories  →  Prisma/PostgreSQL
```

- **routes** — thin HTTP adapters: validate input (Zod), delegate to a service,
  serialize the response. Route files never call `prisma.` directly.
- **services** — business logic and orchestration. Depend on repositories.
- **repositories** — the only layer that touches Prisma/the database.

Features live under `src/features/<feature>/` and each owns its
`*.repository.ts`, `*.service.ts`, `*.routes.ts`, and `*.validation.ts`.

Cross-cutting helpers live in `src/utils/` (password hashing, JWT, slug,
pagination, errors) and `src/middleware/` (auth, error handler).

## Setup

```bash
npm install
cp .env.example .env      # set DATABASE_URL, JWT_SECRET, PORT
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Endpoints

Authentication
- `POST /api/users` — register
- `POST /api/users/login` — login
- `GET /api/user` — current user (auth)
- `PUT /api/user` — update user (auth)

Profiles
- `GET /api/profiles/:username`
- `POST /api/profiles/:username/follow` (auth)
- `DELETE /api/profiles/:username/follow` (auth)

Articles
- `GET /api/articles` (filters: tag, author, favorited; pagination)
- `GET /api/articles/feed` (auth)
- `GET /api/articles/:slug`
- `POST /api/articles` (auth)
- `PUT /api/articles/:slug` (auth, author only)
- `DELETE /api/articles/:slug` (auth, author only)
- `POST /api/articles/:slug/favorite` (auth)
- `DELETE /api/articles/:slug/favorite` (auth)

Comments
- `GET /api/articles/:slug/comments`
- `POST /api/articles/:slug/comments` (auth)
- `DELETE /api/articles/:slug/comments/:id` (auth, author only)

Tags
- `GET /api/tags`

## Error Format

All errors follow the RealWorld envelope:

```json
{ "errors": { "body": ["message"] } }
```

Validation failures return `422`, authentication failures `401`, authorization
failures `403`, and missing resources `404`.

## Testing

```bash
npm test            # run the full suite
npm run test:coverage
```

Unit tests cover password hashing, token signing, slug generation, pagination
math, and error formatting. Integration tests exercise every endpoint via
Supertest against a real test database.
