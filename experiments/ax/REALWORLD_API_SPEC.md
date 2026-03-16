# RealWorld (Conduit) Backend API Specification

**Source:** https://docs.realworld.show/specifications/backend  
**Version:** Current (retrieved March 2026)  
**Purpose:** External ground truth for both control and treatment experiment conditions. This file is identical in both.

---

## Overview

Conduit is a social blogging platform (Medium.com clone). The API is a REST JSON API with JWT-based authentication.

**Stack target (both conditions):** TypeScript, Node.js, Express, Prisma, PostgreSQL, Jest

---

## Authentication

**Header format:**
```
Authorization: Token jwt.token.here
```

---

## Endpoints

### Users & Authentication

**POST /api/users/login** — Authentication  
No auth required. Returns a User.
```json
{
  "user": {
    "email": "jake@jake.jake",
    "password": "jakejake"
  }
}
```
Required fields: `email`, `password`

**POST /api/users** — Registration  
No auth required. Returns a User.
```json
{
  "user": {
    "username": "Jacob",
    "email": "jake@jake.jake",
    "password": "jakejake"
  }
}
```
Required fields: `email`, `username`, `password`

**GET /api/user** — Get Current User  
Auth required. Returns the current User.

**PUT /api/user** — Update User  
Auth required. Returns the User.
```json
{
  "user": {
    "email": "jake@jake.jake",
    "bio": "I like to skateboard",
    "image": "https://i.stack.imgur.com/xHWG8.jpg"
  }
}
```
Accepted fields: `email`, `username`, `password`, `image`, `bio`

---

### Profiles

**GET /api/profiles/:username** — Get Profile  
Auth optional. Returns a Profile.

**POST /api/profiles/:username/follow** — Follow User  
Auth required. Returns a Profile.

**DELETE /api/profiles/:username/follow** — Unfollow User  
Auth required. Returns a Profile.

---

### Articles

**GET /api/articles** — List Articles  
Auth optional. Returns Multiple Articles, most recent first.

Query parameters:
- `tag` — filter by tag: `?tag=AngularJS`
- `author` — filter by author: `?author=jake`
- `favorited` — favorited by user: `?favorited=jake`
- `limit` — default 20: `?limit=20`
- `offset` — default 0: `?offset=0`

**GET /api/articles/feed** — Feed Articles  
Auth required. Returns Multiple Articles from followed users, most recent first.  
Accepts `limit` and `offset` query parameters.

**GET /api/articles/:slug** — Get Article  
No auth required. Returns Single Article.

**POST /api/articles** — Create Article  
Auth required. Returns Single Article.
```json
{
  "article": {
    "title": "How to train your dragon",
    "description": "Ever wonder how?",
    "body": "You have to believe",
    "tagList": ["reactjs", "angularjs", "dragons"]
  }
}
```
Required fields: `title`, `description`, `body`  
Optional fields: `tagList` (array of strings)

**PUT /api/articles/:slug** — Update Article  
Auth required. Returns updated Single Article.  
Slug updates when title changes.
```json
{
  "article": {
    "title": "Did you train your dragon?"
  }
}
```
Optional fields: `title`, `description`, `body`

**DELETE /api/articles/:slug** — Delete Article  
Auth required.

**POST /api/articles/:slug/favorite** — Favorite Article  
Auth required. Returns Single Article.

**DELETE /api/articles/:slug/favorite** — Unfavorite Article  
Auth required. Returns Single Article.

---

### Comments

**POST /api/articles/:slug/comments** — Add Comment  
Auth required. Returns Single Comment.
```json
{
  "comment": {
    "body": "His name was my name too."
  }
}
```
Required field: `body`

**GET /api/articles/:slug/comments** — Get Comments  
Auth optional. Returns Multiple Comments.

**DELETE /api/articles/:slug/comments/:id** — Delete Comment  
Auth required.

---

### Tags

**GET /api/tags** — Get Tags  
No auth required. Returns List of Tags.

---

## Response Formats

### User (for authentication)
```json
{
  "user": {
    "email": "jake@jake.jake",
    "token": "jwt.token.here",
    "username": "jake",
    "bio": null,
    "image": null
  }
}
```

### Profile
```json
{
  "profile": {
    "username": "jake",
    "bio": "I work at statefarm",
    "image": "https://api.realworld.io/images/smiley-cyrus.jpg",
    "following": false
  }
}
```

### Single Article
```json
{
  "article": {
    "slug": "how-to-train-your-dragon",
    "title": "How to train your dragon",
    "description": "Ever wonder how?",
    "body": "It takes a Jacobian",
    "tagList": ["dragons", "training"],
    "createdAt": "2016-02-18T03:22:56.637Z",
    "updatedAt": "2016-02-18T03:48:35.824Z",
    "favorited": false,
    "favoritesCount": 0,
    "author": {
      "username": "jake",
      "bio": "I work at statefarm",
      "image": "https://i.stack.imgur.com/xHWG8.jpg",
      "following": false
    }
  }
}
```

### Multiple Articles
**Note:** As of 2024-08-16, the `body` field is NOT returned in list responses for performance reasons. Affects `GET /api/articles` and `GET /api/articles/feed`.
```json
{
  "articles": [{
    "slug": "how-to-train-your-dragon",
    "title": "How to train your dragon",
    "description": "Ever wonder how?",
    "tagList": ["dragons", "training"],
    "createdAt": "2016-02-18T03:22:56.637Z",
    "updatedAt": "2016-02-18T03:48:35.824Z",
    "favorited": false,
    "favoritesCount": 0,
    "author": {
      "username": "jake",
      "bio": "I work at statefarm",
      "image": "https://i.stack.imgur.com/xHWG8.jpg",
      "following": false
    }
  }],
  "articlesCount": 2
}
```

### Single Comment
```json
{
  "comment": {
    "id": 1,
    "createdAt": "2016-02-18T03:22:56.637Z",
    "updatedAt": "2016-02-18T03:22:56.637Z",
    "body": "It takes a Jacobian",
    "author": {
      "username": "jake",
      "bio": "I work at statefarm",
      "image": "https://i.stack.imgur.com/xHWG8.jpg",
      "following": false
    }
  }
}
```

### Multiple Comments
```json
{
  "comments": [{
    "id": 1,
    "createdAt": "2016-02-18T03:22:56.637Z",
    "updatedAt": "2016-02-18T03:22:56.637Z",
    "body": "It takes a Jacobian",
    "author": {
      "username": "jake",
      "bio": "I work at statefarm",
      "image": "https://i.stack.imgur.com/xHWG8.jpg",
      "following": false
    }
  }]
}
```

### List of Tags
```json
{
  "tags": [
    "reactjs",
    "angularjs"
  ]
}
```

---

## Error Handling

```json
{
  "errors": {
    "body": ["can't be empty"]
  }
}
```

Status codes:
- 401 Unauthorized — Missing or invalid token
- 403 Forbidden — Authenticated but not permitted (e.g., deleting another user's article)
- 404 Not Found
- 422 Unprocessable Entity — Validation errors

---

## CORS

CORS headers must be present. Preflight OPTIONS requests must return 200.  
All origins should be accepted.

---

## Content Type

All responses: `Content-Type: application/json; charset=utf-8`
