# Conduit Backend

RealWorld (Conduit) backend implemented in TypeScript + Express + Prisma/PostgreSQL.

## Setup

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Set `DATABASE_URL` and `JWT_SECRET` in `.env`.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — compile TypeScript
- `npm start` — run compiled server
- `npm test` — run tests

## Endpoints

- `POST /api/users` — register
- `POST /api/users/login` — login
- `GET /api/user` — current user
- `PUT /api/user` — update user
- `GET /api/profiles/:username` — profile
- `POST /api/profiles/:username/follow` — follow
- `DELETE /api/profiles/:username/follow` — unfollow
- `GET /api/articles` — list articles
- `GET /api/articles/feed` — feed
- `GET /api/articles/:slug` — get article
- `POST /api/articles` — create article
- `PUT /api/articles/:slug` — update article
- `DELETE /api/articles/:slug` — delete article
- `POST /api/articles/:slug/favorite` — favorite
- `DELETE /api/articles/:slug/favorite` — unfavorite
- `GET /api/articles/:slug/comments` — get comments
- `POST /api/articles/:slug/comments` — add comment
- `DELETE /api/articles/:slug/comments/:id` — delete comment
- `GET /api/tags` — list tags
