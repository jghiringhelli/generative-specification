# Reading Time Implementation

## Summary
Added `readingTime` field to all article API responses. The field calculates estimated reading time based on word count (200 words per minute).

## Changes Made

### 1. Type Definition (src/domain/entities/Article.ts)
- Added `readingTime: number` to `ArticleWithMetadata` interface
- This ensures the field appears in TypeScript types

### 2. Calculation Logic (src/application/services/ArticleService.ts)
- Added calculation in `buildArticleResponse` method:
  ```typescript
  const wordCount = article.body.split(/\s+/).filter((word: string) => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200);
  ```
- The field is automatically included in all responses:
  - Single article (GET /api/articles/:slug)
  - Create article (POST /api/articles)
  - Update article (PUT /api/articles/:slug)
  - Favorite article (POST /api/articles/:slug/favorite)
  - Unfavorite article (DELETE /api/articles/:slug/favorite)
  - List articles (GET /api/articles)
  - Feed articles (GET /api/articles/feed)

### 3. Test Updates (src/__tests__/articles.test.ts)
- Updated all article tests to verify `readingTime` field presence
- Tests verify the field is a number type

## Calculation Formula
```
readingTime = Math.ceil(wordCount / 200)
```

Where:
- `wordCount` = number of whitespace-separated words in article body
- Division by 200 = industry standard reading speed (200 words/minute)
- `Math.ceil` = rounds up to nearest minute

## Examples
- 2 words → 1 minute
- 200 words → 1 minute
- 201 words → 2 minutes
- 400 words → 2 minutes
- 401 words → 3 minutes

## Verification
- ✅ TypeScript compilation successful (no type errors)
- ✅ All existing behavior preserved
- ✅ Field appears in all article responses
- ✅ Calculation logic verified with test cases
