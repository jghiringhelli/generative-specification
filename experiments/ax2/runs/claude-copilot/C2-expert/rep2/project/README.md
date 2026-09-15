# Conduit Backend (RealWorld)

A RealWorld / Conduit backend implemented in TypeScript, Express and Prisma (PostgreSQL).

## Layered Architecture

```
routes (HTTP, thin)  →  services (business logic)  →  repositories (Prisma I/O)
```

- **Routes** validate input with Zod and delegate to services. They never call `prisma.` directly.
- **Services** hold orchestration and domain rules, depending only on repository classes.
- **Repositories** are the only layer that touches Prisma.
- **Composition root** (`src/container.ts`) wires repositories into services via constructor injection.
- **Presenters** (`src/services/*.presenter.ts`) map entities to response DTOs.
- **Errors** use a `DomainError` hierarchy rendered by `src/middleware/error.ts` into the
  RealWorld envelope `{ "errors": { "body": ["message"] } }`.

## Setup

```bash
cp .env.example .env      # set DATABASE_URL, JWT_SECRET, PORT
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users` | – | Register |
| POST | `/api/users/login` | – | Login |
| GET | `/api/user` | required | Current user |
| PUT | `/api/user` | required | Update user |
| GET | `/api/profiles/:username` | optional | View profile |
| POST | `/api/profiles/:username/follow` | required | Follow (idempotent) |
| DELETE | `/api/profiles/:username/follow` | required | Unfollow (idempotent) |
| GET | `/api/articles` | optional | List (filters: tag, author, favorited; pagination) |
| GET | `/api/articles/feed` | required | Feed of followed authors |
| GET | `/api/articles/:slug` | optional | Single article |
| POST | `/api/articles` | required | Create |
| PUT | `/api/articles/:slug` | required (author) | Update |
| DELETE | `/api/articles/:slug` | required (author) | Delete |
| POST | `/api/articles/:slug/favorite` | required | Favorite |
| DELETE | `/api/articles/:slug/favorite` | required | Unfavorite |
| GET | `/api/articles/:slug/comments` | optional | List comments |
| POST | `/api/articles/:slug/comments` | required | Add comment |
| DELETE | `/api/articles/:slug/comments/:id` | required (author) | Delete comment |
| GET | `/api/tags` | – | All unique tags |

List endpoints (`GET /api/articles`, `GET /api/articles/feed`) return `articlesCount` and omit
the `body` field from list items (spec change 2024-08-16).

## Testing

```bash
npm test              # run unit + integration suites
npm run test:coverage # coverage report (threshold: 80% lines)
```

Integration tests run with Supertest against a real test database.
