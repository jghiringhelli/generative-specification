# Conduit Backend

A RealWorld (Conduit) backend built with TypeScript, Express, and Prisma (PostgreSQL).

## Setup

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Configure `.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/conduit?schema=public"
JWT_SECRET="super-secret-jwt-key-change-me"
JWT_EXPIRES_IN="7d"
PORT=3000
```

## Scripts

- `npm run dev` — start dev server with reload
- `npm run build` — compile TypeScript
- `npm start` — run compiled server
- `npm test` — run Jest tests
- `npm run prisma:migrate` — run migrations

## Endpoints

### Authentication
- `POST /api/users` — register
- `POST /api/users/login` — log in
- `GET /api/user` — current user
- `PUT /api/user` — update current user

### Profiles
- `GET /api/profiles/:username`
- `POST /api/profiles/:username/follow`
- `DELETE /api/profiles/:username/follow`

### Articles
- `GET /api/articles` — list (filters: tag, author, favorited, limit, offset)
- `GET /api/articles/feed`
- `GET /api/articles/:slug`
- `POST /api/articles`
- `PUT /api/articles/:slug`
- `DELETE /api/articles/:slug`
- `POST /api/articles/:slug/favorite`
- `DELETE /api/articles/:slug/favorite`

### Comments
- `GET /api/articles/:slug/comments`
- `POST /api/articles/:slug/comments`
- `DELETE /api/articles/:slug/comments/:id`

### Tags
- `GET /api/tags`

Authenticate with the `Authorization: Token <jwt>` header.
