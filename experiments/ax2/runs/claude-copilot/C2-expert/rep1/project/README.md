# Conduit Backend

A [RealWorld](https://realworld-docs.netlify.app/) (Conduit) backend built with
**TypeScript + Express + Prisma/PostgreSQL**.

## Layered Architecture

Requests flow strictly inward; dependencies point inward only:

```
routes (driving adapters)  →  services (business logic)  →  repositories (driven adapters)  →  Prisma/PostgreSQL
```

- **Routes** are thin: input validation (Zod) + delegation. They never touch `prisma.*`.
- **Services** own business logic and orchestration; they depend on repository classes.
- **Repositories** are the only place Prisma models are accessed.
- **Composition root** (`src/app.ts`) wires repositories → services → routers via constructor injection.

Feature modules live under `src/modules/<feature>/` and each own their repository,
service, schemas and routes.

## Setup

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET, PORT
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Environment Variables

| Variable       | Description                          |
| -------------- | ------------------------------------ |
| `DATABASE_URL` | PostgreSQL connection string          |
| `JWT_SECRET`   | Secret used to sign JWTs (required)   |
| `PORT`         | HTTP port (default 3000)              |

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
- `GET /api/articles` — list (filters: tag, author, favorited; pagination limit/offset)
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

## Error Format

All errors conform to the RealWorld envelope:

```json
{ "errors": { "body": ["message"] } }
```

Validation failures return HTTP 422; auth failures 401; forbidden 403; missing 404.

## Testing

```bash
npm test              # run the suite
npm run test:coverage # run with coverage (threshold: 80% lines)
```

Unit tests cover password hashing, JWT sign/verify, slug generation, pagination
math and error formatting. Integration tests exercise every endpoint at the HTTP
boundary via Supertest against a real PostgreSQL test database.
