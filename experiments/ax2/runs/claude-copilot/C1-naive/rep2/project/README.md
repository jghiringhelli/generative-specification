# Conduit Backend

A [RealWorld](https://github.com/gothinkster/realworld) (Conduit) backend implemented in
**TypeScript + Express + Prisma/PostgreSQL**.

## Features

- JWT authentication (register, login, current user, update user)
- User profiles (view, follow, unfollow)
- Articles (CRUD, list with filters, feed, favorite/unfavorite)
- Comments (list, add, delete)
- Tags

## Setup

```bash
npm install
# configure DATABASE_URL and JWT_SECRET in .env
npx prisma migrate dev --name init
npm run dev
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run dev` | Run in watch mode |
| `npm test` | Run the Jest test suite |
| `npm run prisma:migrate` | Apply Prisma migrations |

## API Endpoints

### Auth
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
