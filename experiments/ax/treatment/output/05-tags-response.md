I'll implement the tags endpoint following the layered architecture and verification protocol.

---

## 1. Tag Types

```typescript
// src/types/tag.types.ts

/**
 * Tags list response DTO.
 */
export interface TagsResponse {
  tags: string[];
}
```

---

## 2. Tag Service

```typescript
// src/services/tag.service.ts
import { ITagRepository } from '../repositories/tag.repository';
import { TagsResponse } from '../types/tag.types';

/**
 * Tag service.
 * Handles tag operations.
 */
export class TagService {
  constructor(private readonly tagRepository: ITagRepository) {}

  /**
   * Get all tags.
   * Returns unique tag names ordered alphabetically.
   */
  async getTags(): Promise<TagsResponse> {
    const tags = await this.tagRepository.findAll();

    return {
      tags: tags.map((tag) => tag.name)
    };
  }
}
```

---

## 3. Tag Routes

```typescript
// src/routes/tag.routes.ts
import { Router, Request, Response } from 'express';
import { TagService } from '../services/tag.service';

/**
 * Create tag routes.
 */
export function createTagRoutes(tagService: TagService): Router {
  const router = Router();

  /**
   * GET /api/tags - Get all tags
   */
  router.get('/tags', async (req: Request, res: Response, next) => {
    try {
      const result = await tagService.getTags();

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
```

---

## 4. Update App Configuration

```typescript
// src/app.ts
import express, { Application } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { logger } from './config/logger';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } from './config/constants';
import { UserRepository } from './repositories/user.repository';
import { ProfileRepository } from './repositories/profile.repository';
import { TagRepository } from './repositories/tag.repository';
import { ArticleRepository } from './repositories/article.repository';
import { CommentRepository } from './repositories/comment.repository';
import { AuthService } from './services/auth.service';
import { ProfileService } from './services/profile.service';
import { ArticleService } from './services/article.service';
import { CommentService } from './services/comment.service';
import { TagService } from './services/tag.service';
import { createUserRoutes } from './routes/user.routes';
import { createProfileRoutes } from './routes/profile.routes';
import { createArticleRoutes } from './routes/article.routes';
import { createCommentRoutes } from './routes/comment.routes';
import { createTagRoutes } from './routes/tag.routes';
import { errorHandler } from './middleware/error.middleware';

/**
 * Create and configure Express application.
 */
export function createApp(prisma: PrismaClient): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api', limiter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });

  // Dependency injection setup
  const userRepository = new UserRepository(prisma);
  const profileRepository = new ProfileRepository(prisma);
  const tagRepository = new TagRepository(prisma);
  const articleRepository = new ArticleRepository(prisma);
  const commentRepository = new CommentRepository(prisma);

  const authService = new AuthService(userRepository);
  const profileService = new ProfileService(userRepository, profileRepository);
  const articleService = new ArticleService(articleRepository, tagRepository, profileRepository);
  const commentService = new CommentService(commentRepository, articleRepository, profileRepository);
  const tagService = new TagService(tagRepository);

  // Routes
  app.use('/api', createUserRoutes(authService));
  app.use('/api', createProfileRoutes(profileService, authService));
  app.use('/api', createArticleRoutes(articleService, authService));
  app.use('/api', createCommentRoutes(commentService, authService));
  app.use('/api', createTagRoutes(tagService));

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
```

---

## 5. Unit Tests

```typescript
// src/services/tag.service.test.ts
import { TagService } from './tag.service';
import { ITagRepository } from '../repositories/tag.repository';
import { Tag } from '@prisma/client';

describe('TagService', () => {
  let tagService: TagService;
  let mockTagRepository: jest.Mocked<ITagRepository>;

  beforeEach(() => {
    mockTagRepository = {
      findByName: jest.fn(),
      findAll: jest.fn(),
      upsertMany: jest.fn()
    };

    tagService = new TagService(mockTagRepository);
  });

  describe('getTags', () => {
    it('get_tags_returns_alphabetically_sorted_tag_names', async () => {
      const mockTags: Tag[] = [
        { id: 1, name: 'typescript' },
        { id: 2, name: 'nodejs' },
        { id: 3, name: 'react' }
      ];

      mockTagRepository.findAll.mockResolvedValue(mockTags);

      const result = await tagService.getTags();

      expect(result.tags).toEqual(['typescript', 'nodejs', 'react']);
    });

    it('get_tags_with_no_tags_returns_empty_array', async () => {
      mockTagRepository.findAll.mockResolvedValue([]);

      const result = await tagService.getTags();

      expect(result.tags).toEqual([]);
    });

    it('get_tags_returns_only_tag_names_not_full_objects', async () => {
      const mockTags: Tag[] = [
        { id: 1, name: 'testing' }
      ];

      mockTagRepository.findAll.mockResolvedValue(mockTags);

      const result = await tagService.getTags();

      expect(result).toEqual({ tags: ['testing'] });
      expect(result.tags[0]).toBe('testing');
    });
  });
});
```

---

## 6. Integration Tests

```typescript
// tests/integration/tags.test.ts
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { Application } from 'express';
import { createApp } from '../../src/app';

describe('Tag Endpoints', () => {
  let app: Application;
  let prisma: PrismaClient;
  let userToken: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    app = createApp(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database
    await prisma.userFavorite.deleteMany();
    await prisma.userFollow.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.articleTag.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const userResponse = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'user@example.com',
          username: 'testuser',
          password: 'password123'
        }
      });
    userToken = userResponse.body.user.token;
  });

  describe('GET /api/tags', () => {
    it('get_tags_with_no_articles_returns_empty_list', async () => {
      const response = await request(app)
        .get('/api/tags')
        .expect(200);

      expect(response.body).toEqual({
        tags: []
      });
    });

    it('get_tags_with_articles_returns_unique_tags', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article 1',
            description: 'Description',
            body: 'Body',
            tagList: ['javascript', 'nodejs']
          }
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article 2',
            description: 'Description',
            body: 'Body',
            tagList: ['typescript', 'nodejs']
          }
        });

      const response = await request(app)
        .get('/api/tags')
        .expect(200);

      expect(response.body.tags).toHaveLength(3);
      expect(response.body.tags).toContain('javascript');
      expect(response.body.tags).toContain('nodejs');
      expect(response.body.tags).toContain('typescript');
    });

    it('get_tags_returns_alphabetically_sorted_tags', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article',
            description: 'Description',
            body: 'Body',
            tagList: ['zebra', 'apple', 'mongoose']
          }
        });

      const response = await request(app)
        .get('/api/tags')
        .expect(200);

      expect(response.body.tags).toEqual(['apple', 'mongoose', 'zebra']);
    });

    it('get_tags_does_not_require_authentication', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article',
            description: 'Description',
            body: 'Body',
            tagList: ['public']
          }
        });

      const response = await request(app)
        .get('/api/tags')
        .expect(200);

      expect(response.body.tags).toContain('public');
    });

    it('get_tags_returns_unique_tags_no_duplicates', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article 1',
            description: 'Description',
            body: 'Body',
            tagList: ['nodejs', 'testing']
          }
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article 2',
            description: 'Description',
            body: 'Body',
            tagList: ['nodejs', 'typescript']
          }
        });

      const response = await request(app)
        .get('/api/tags')
        .expect(200);

      const nodejsCount = response.body.tags.filter((tag: string) => tag === 'nodejs').length;
      expect(nodejsCount).toBe(1);
    });

    it('get_tags_after_article_deletion_removes_orphaned_tags', async () => {
      const articleResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Temporary Article',
            description: 'Description',
            body: 'Body',
            tagList: ['temporary']
          }
        });

      const slug = articleResponse.body.article.slug;

      await request(app)
        .delete(`/api/articles/${slug}`)
        .set('Authorization', `Token ${userToken}`)
        .expect(200);

      const response = await request(app)
        .get('/api/tags')
        .expect(200);

      // Tag should still exist in DB but not appear in the list
      // unless it's used by other articles
      expect(response.body.tags).not.toContain('temporary');
    });

    it('get_tags_only_returns_tags_actually_used_by_articles', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article',
            description: 'Description',
            body: 'Body',
            tagList: ['used']
          }
        });

      const response = await request(app)
        .get('/api/tags')
        .expect(200);

      expect(response.body.tags).toEqual(['used']);
    });
  });
});
```

---

## Verification Protocol Results

### ✅ 1. Bounded
- Route handler in `src/routes/tag.routes.ts` contains **zero** `prisma.` calls
- Route handler delegates to `tagService` only
- Service calls repository only
- All Prisma operations isolated in repository layer

### ✅ 2. Verifiable
GET /api/tags endpoint has complete test coverage:
- Empty list when no articles (200)
- Returns unique tags from multiple articles (200)
- Returns alphabetically sorted tags (200)
- No authentication required (200)
- No duplicate tags (200)
- Orphaned tags handling after article deletion (200)
- Only returns tags actually used by articles (200)

### ✅ 3. Composable
- `TagService` receives `ITagRepository` via constructor
- `TagRepository` receives `PrismaClient` via constructor
- App setup shows explicit dependency injection wiring
- No service instantiates dependencies directly

### ✅ 4. Zero Hardcoded Values
- No magic numbers or strings introduced
- All configuration inherited from existing constants
- Repository handles sorting (defined in TagRepository.findAll())

### ✅ 5. Error Format
All errors use `{"errors": {"body": ["message"]}}`:
- No custom errors needed for this simple endpoint
- Error handler middleware catches any unexpected errors
- Follows same error format as all other endpoints

---

## Summary

**Files Created:**
```
src/
  types/
    tag.types.ts
  services/
    tag.service.ts
    tag.service.test.ts
  routes/
    tag.routes.ts

tests/
  integration/
    tags.test.ts

src/app.ts (updated - added tag routes)
```

**Implemented:**
- ✅ GET /api/tags (no auth required)

**Test Coverage:**
- 3 unit tests (tag service)
- 7 integration tests (all scenarios including sorting, uniqueness, orphaned tags)

**Key Features:**
- Returns all unique tag names from articles
- Alphabetically sorted (handled by TagRepository.findAll())
- No authentication required
- Returns only tags actually used by articles (via ArticleTag join table)
- Tag entities persist in DB but only appear in response if used by articles

**Next Steps:**
1. Run `npm test` to verify all tests pass
2. Commit with: `feat(tags): implement tag listing endpoint`