# Conduit Backend

A [RealWorld](https://github.com/gothinkster/realworld) (Conduit) backend implemented in
**TypeScript + Express + Prisma (PostgreSQL)**.

## Setup

```bash
npm install
cp .env.example .env   # or edit .env
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## Environment

| Variable       | Description                        |
| -------------- | ---------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string       |
| `JWT_SECRET`   | Secret used to sign JWT tokens     |
| `PORT`         | HTTP port (default `3000`)         |

## Scripts

| Script                  | Purpose                          |
| ----------------------- | -------------------------------- |
| `npm run dev`           | Start dev server (ts-node-dev)   |
| `npm run build`         | Compile TypeScript to `dist/`    |
| `npm start`             | Run compiled server              |
| `npm test`              | Run the Jest test suite          |
| `npm run prisma:migrate`| Run Prisma migrations            |

## API Endpoints

### Auth / User
- `POST /api/users` — register
- `POST /api/users/login` — log in
- `GET /api/user` — get current user
- `PUT /api/user` — update current user

### Profiles
- `GET /api/profiles/:username` — get a profile
- `POST /api/profiles/:username/follow` — follow a user
- `DELETE /api/profiles/:username/follow` — unfollow a user

### Articles
- `GET /api/articles` — list articles (filters: `tag`, `author`, `favorited`, `limit`, `offset`)
- `GET /api/articles/feed` — feed from followed users
- `GET /api/articles/:slug` — get article
- `POST /api/articles` — create article
- `PUT /api/articles/:slug` — update article
- `DELETE /api/articles/:slug` — delete article
- `POST /api/articles/:slug/favorite` — favorite article
- `DELETE /api/articles/:slug/favorite` — unfavorite article

### Comments
- `GET /api/articles/:slug/comments` — get comments
- `POST /api/articles/:slug/comments` — add comment
- `DELETE /api/articles/:slug/comments/:id` — delete comment

### Tags
- `GET /api/tags` — list all tags

## Auth

Send the JWT in the `Authorization` header as `Token <jwt>` (also accepts `Bearer <jwt>`).
