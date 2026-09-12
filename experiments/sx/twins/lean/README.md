# Conduit API with Reading Time

A social blogging platform API built with Express, TypeScript, and Prisma. This implementation includes a `readingTime` field on all article responses.

## Features

- **Reading Time Calculation**: Every article response includes a `readingTime` field (integer) calculated as `Math.ceil(wordCount / 200)`
- User authentication (register, login)
- Article CRUD operations
- Article favoriting
- Article feed
- Tag support

## Reading Time Implementation

The `readingTime` field appears on every article in all API responses:

- `POST /api/articles` - Create article
- `GET /api/articles/:slug` - Get single article
- `PUT /api/articles/:slug` - Update article
- `POST /api/articles/:slug/favorite` - Favorite article
- `DELETE /api/articles/:slug/favorite` - Unfavorite article
- `GET /api/articles` - List articles
- `GET /api/articles/feed` - Get feed

### Calculation

```typescript
function calculateReadingTime(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
}
```

- Splits article body by whitespace to count words
- Divides by 200 words per minute
- Rounds up using `Math.ceil()`
- Returns an integer

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials.

3. Run database migrations:
```bash
npm run prisma:migrate
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

## Development

```bash
npm run dev
```

## Testing

```bash
npm test
```

The test suite includes comprehensive tests for the `readingTime` field across all endpoints.

## API Response Examples

### Create Article Response
```json
{
  "article": {
    "slug": "test-article-xyz123",
    "title": "Test Article",
    "description": "A test article",
    "body": "Article body with content...",
    "tagList": ["test"],
    "createdAt": "2026-09-11T12:00:00.000Z",
    "updatedAt": "2026-09-11T12:00:00.000Z",
    "favorited": false,
    "favoritesCount": 0,
    "readingTime": 2,
    "author": {
      "username": "johndoe",
      "bio": null,
      "image": null,
      "following": false
    }
  }
}
```

### List Articles Response
```json
{
  "articles": [
    {
      "slug": "article-1",
      "title": "Article 1",
      "description": "Description",
      "body": "Body...",
      "tagList": ["tech"],
      "createdAt": "2026-09-11T12:00:00.000Z",
      "updatedAt": "2026-09-11T12:00:00.000Z",
      "favorited": false,
      "favoritesCount": 5,
      "readingTime": 3,
      "author": {...}
    }
  ],
  "articlesCount": 1
}
```

## Implementation Details

### Key Files

- `src/utils/readingTime.ts` - Reading time calculation function
- `src/utils/formatArticle.ts` - Article response formatter (includes readingTime)
- `src/routes/articles.ts` - Article endpoints
- `src/types/article.ts` - TypeScript types with readingTime field
- `src/tests/articles.test.ts` - Comprehensive test suite

### Architecture

The implementation uses a centralized `formatArticle` function that:
1. Retrieves article data from Prisma
2. Calculates reading time from the article body
3. Formats the response with all required fields including `readingTime`
4. Returns consistent structure across all endpoints

This ensures the `readingTime` field is present on every article response without duplication.
