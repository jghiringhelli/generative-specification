# Conduit Backend (RealWorld)

A backend implementation of the RealWorld / Conduit specification built with TypeScript, Express, and Prisma with PostgreSQL.

## Features

- **Authentication & Users**: JWT-based authentication, user registration, login, current user endpoint, profile updates.
- **Profiles**: Public profiles, follow/unfollow users.
- **Articles**: CRUD operations for articles, article feeds, filtering by tag/author/favorited, favoriting/unfavoriting.
- **Comments**: Add, get, and delete comments on articles.
- **Tags**: Retrieve list of all article tags.

## API Endpoints

### Authentication / Users
- `POST /api/users` - Register a new user
- `POST /api/users/login` - User login
- `GET /api/user` - Get current user
- `PUT /api/user` - Update current user

### Profiles
- `GET /api/profiles/:username` - Get profile
- `POST /api/profiles/:username/follow` - Follow user
- `DELETE /api/profiles/:username/follow` - Unfollow user

### Articles
- `GET /api/articles` - List articles (filters: tag, author, favorited, limit, offset)
- `GET /api/articles/feed` - Feed articles from followed users
- `GET /api/articles/:slug` - Get single article
- `POST /api/articles` - Create article
- `PUT /api/articles/:slug` - Update article
- `DELETE /api/articles/:slug` - Delete article
- `POST /api/articles/:slug/favorite` - Favorite article
- `DELETE /api/articles/:slug/favorite` - Unfavorite article

### Comments
- `GET /api/articles/:slug/comments` - Get comments for an article
- `POST /api/articles/:slug/comments` - Add comment to an article
- `DELETE /api/articles/:slug/comments/:id` - Delete comment

### Tags
- `GET /api/tags` - Get all tags
