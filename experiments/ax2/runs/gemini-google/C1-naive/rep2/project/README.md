# Conduit RealWorld Backend

A RealWorld / Conduit backend implementation built with TypeScript, Express, and Prisma (PostgreSQL).

## Features

- **Authentication & Users**: JWT-based authentication, user registration, login, get current user, update user settings.
- **Profiles**: View user profiles, follow and unfollow users.
- **Articles**: CRUD operations for articles, pagination (limit/offset), tag/author/favorite filters, feed from followed authors, favorite/unfavorite articles.
- **Comments**: Add, view, and delete comments on articles.
- **Tags**: List all unique tags.

## API Endpoints

### Authentication & Users
- `POST /api/users` — Register a new user
- `POST /api/users/login` — Log in an existing user
- `GET /api/user` — Get current user profile (requires auth)
- `PUT /api/user` — Update current user profile (requires auth)

### Profiles
- `GET /api/profiles/:username` — Get profile by username
- `POST /api/profiles/:username/follow` — Follow user (requires auth)
- `DELETE /api/profiles/:username/follow` — Unfollow user (requires auth)

### Articles
- `GET /api/articles` — List articles (filters: tag, author, favorited, limit, offset)
- `GET /api/articles/feed` — Feed of articles from followed users (requires auth)
- `GET /api/articles/:slug` — Get article by slug
- `POST /api/articles` — Create article (requires auth)
- `PUT /api/articles/:slug` — Update article (requires auth, author only)
- `DELETE /api/articles/:slug` — Delete article (requires auth, author only)
- `POST /api/articles/:slug/favorite` — Favorite article (requires auth)
- `DELETE /api/articles/:slug/favorite` — Unfavorite article (requires auth)

### Comments
- `GET /api/articles/:slug/comments` — Get comments for article
- `POST /api/articles/:slug/comments` — Add comment to article (requires auth)
- `DELETE /api/articles/:slug/comments/:id` — Delete comment (requires auth, author only)

### Tags
- `GET /api/tags` — Get list of all tags

## Getting Started

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and `JWT_SECRET`.
2. Run Prisma migration: `npm run prisma:migrate`
3. Generate Prisma client: `npm run prisma:generate`
4. Start development server: `npm run dev`
5. Run tests: `npm test`
