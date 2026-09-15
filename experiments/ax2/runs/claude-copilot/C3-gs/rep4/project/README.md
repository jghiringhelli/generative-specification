# Conduit Backend

A [RealWorld](https://realworld-docs.netlify.app/) (Conduit) API implementation in
**TypeScript + Express + Prisma + PostgreSQL**, built with a hexagonal (ports & adapters)
architecture: thin routes, business logic in services, persistence behind repository ports,
and a composition root that wires concrete adapters via dependency injection.

## Architecture

```
routes (driving adapters)  ->  services (business logic)  ->  repository ports
                                       |                               |
                                    DTO views                   Prisma adapters (driven)
```

- **Domain** (`src/domain`): plain entity/data contracts, no framework imports.
- **Ports** (`src/repositories/I*.ts`, `src/services/ports`): abstract contracts.
- **Services** (`src/services`): orchestration, depend only on ports.
- **Adapters** (`src/repositories/Prisma*.ts`, `src/services/adapters`): Prisma, JWT, argon2.
- **API** (`src/routes`, `src/middleware`): validation + delegation only.
- **Composition root** (`src/container`): the only place concretes are instantiated.

## Endpoints

| Method | Path | Auth |
|---|---|---|
| POST | `/api/users` | — |
| POST | `/api/users/login` | — |
| GET | `/api/user` | required |
| PUT | `/api/user` | required |
| GET | `/api/profiles/:username` | optional |
| POST | `/api/profiles/:username/follow` | required |
| DELETE | `/api/profiles/:username/follow` | required |
| GET | `/api/articles` | optional |
| GET | `/api/articles/feed` | required |
| GET | `/api/articles/:slug` | optional |
| POST | `/api/articles` | required |
| PUT | `/api/articles/:slug` | author |
| DELETE | `/api/articles/:slug` | author |
| POST | `/api/articles/:slug/favorite` | required |
| DELETE | `/api/articles/:slug/favorite` | required |
| GET | `/api/articles/:slug/comments` | optional |
| POST | `/api/articles/:slug/comments` | required |
| DELETE | `/api/articles/:slug/comments/:id` | author |
| GET | `/api/tags` | — |

List responses (`GET /api/articles`, `GET /api/articles/feed`) omit the `body` field.

Errors follow the RealWorld envelope: `{"errors": {"body": ["message"]}}`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm test` | Run the Jest suite |
| `npm run test:coverage` | Run tests with coverage gate (80%) |
| `npm run lint` | ESLint |
| `npm run prisma:migrate` | Apply migrations |
| `npm run mutation` | Stryker mutation testing |

## Configuration

Copy `.env.example` to `.env`. Required: `DATABASE_URL`, `JWT_SECRET`. Optional:
`JWT_EXPIRY` (default `7d`), `PORT` (default `3000`).
