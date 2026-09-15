# Conduit Backend

RealWorld (Conduit) backend implemented in TypeScript + Express + Prisma/PostgreSQL.

## Setup

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Configure `.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/conduit?schema=public"
JWT_SECRET="supersecretjwtkeychangeme"
PORT=3000
```

## Endpoints

### Auth / Users
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

## Tests

```bash
npm test
```
