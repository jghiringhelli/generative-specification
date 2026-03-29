---
nav_exclude: true
---

I'll implement the tags endpoint.

```typescript
// src/services/tag.service.ts

/**
 * Tag service.
 * Handles tag retrieval.
 */

import type { ITagRepository } from '../repositories/ITagRepository';

export class TagService {
  constructor(private readonly tagRepository: ITagRepository) {}

  /**
   * Get all unique tags.
   * Returns tags that have been used in at least one article.
   */
  async getAllTags(): Promise<string[]> {
    return await this.tagRepository.listAll();
  }
}
```

```typescript
// src/routes/tag.routes.ts

/**
 * Tag route handlers.
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { TagService } from '../services/tag.service';

export function createTagRoutes(tagService: TagService): Router {
  const router = Router();

  /**
   * GET /api/tags — Get all tags
   */
  router.get('/tags', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tags = await tagService.getAllTags();

      res.status(200).json({ tags });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
```

```typescript
// src/app.ts

/**
 * Express application setup.
 * Configures middleware, routes, and error handling.
 */

import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { env } from './config/env';
import { PrismaUserRepository } from './repositories/PrismaUserRepository';
import { PrismaProfileRepository } from './repositories/PrismaProfileRepository';
import { PrismaArticleRepository } from './repositories/PrismaArticleRepository';
import { PrismaTagRepository } from './repositories/PrismaTagRepository';
import { PrismaCommentRepository } from './repositories/PrismaCommentRepository';
import { AuthService } from './services/auth.service';
import { ProfileService } from './services/profile.service';
import { ArticleService } from './services/article.service';
import { CommentService } from './services/comment.service';
import { TagService } from './services/tag.service';
import { createAuthRoutes } from './routes/auth.routes';
import { createProfileRoutes } from './routes/profile.routes';
import { createArticleRoutes } from './routes/article.routes';
import { createCommentRoutes } from './routes/comment.routes';
import { createTagRoutes } from './routes/tag.routes';
import { errorHandler } from './middleware/errorHandler.middleware';

export function createApp(prisma: PrismaClient) {
  const app = express();

  // Middleware
  app.use(cors()); // RealWorld spec: accept all origins
  app.use(express.json());
  app.use(
    pinoHttp({
      level: env.LOG_LEVEL,
      redact: ['req.headers.authorization'] // Never log tokens
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { errors: { body: ['too many requests'] } }
  });
  app.use(limiter);

  // Dependency injection — composition root
  const userRepository = new PrismaUserRepository(prisma);
  const profileRepository = new PrismaProfileRepository(prisma);
  const articleRepository = new PrismaArticleRepository(prisma);
  const tagRepository = new PrismaTagRepository(prisma);
  const commentRepository = new PrismaCommentRepository(prisma);
  
  const authService = new AuthService(userRepository);
  const profileService = new ProfileService(profileRepository);
  const articleService = new ArticleService(articleRepository, tagRepository);
  const commentService = new CommentService(commentRepository);
  const tagService = new TagService(tagRepository);

  // Routes
  app.use('/api', createAuthRoutes(authService));
  app.use('/api', createProfileRoutes(profileService));
  app.use('/api', createArticleRoutes(articleService));
  app.use('/api', createCommentRoutes(commentService));
  app.use('/api', createTagRoutes(tagService));

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
```

```typescript
// src/services/tag.service.test.ts

/**
 * Unit tests for TagService.
 */

import { TagService } from './tag.service';
import type { ITagRepository } from '../repositories/ITagRepository';

const mockTagRepository: jest.Mocked<ITagRepository> = {
  listAll: jest.fn(),
  upsertMany: jest.fn(),
  findByName: jest.fn()
};

describe('TagService', () => {
  let tagService: TagService;

  beforeEach(() => {
    jest.clearAllMocks();
    tagService = new TagService(mockTagRepository);
  });

  describe('getAllTags', () => {
    it('returns list of all tags', async () => {
      const tags = ['reactjs', 'angularjs', 'dragons'];
      mockTagRepository.listAll.mockResolvedValue(tags);

      const result = await tagService.getAllTags();

      expect(mockTagRepository.listAll).toHaveBeenCalled();
      expect(result).toEqual(tags);
    });

    it('returns empty array when no tags exist', async () => {
      mockTagRepository.listAll.mockResolvedValue([]);

      const result = await tagService.getAllTags();

      expect(result).toEqual([]);
    });
  });
});
```

```typescript
// tests/integration/tag.test.ts

/**
 * Integration tests for tag endpoints.
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import type { Express } from 'express';

const prisma = new PrismaClient();
let app: Express;

beforeAll(async () => {
  app = createApp(prisma);
});

beforeEach(async () => {
  await prisma.userFavorite.deleteMany();
  await prisma.userFollow.deleteMany();
  await prisma.articleTag.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/tags', () => {
  it('returns empty array when no tags exist', async () => {
    const response = await request(app).get('/api/tags').expect(200);

    expect(response.body.tags).toEqual([]);
  });

  it('returns all unique tags from articles', async () => {
    // Create user
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    // Create articles with tags
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'React Article',
          description: 'About React',
          body: 'React content',
          tagList: ['reactjs', 'javascript']
        }
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Angular Article',
          description: 'About Angular',
          body: 'Angular content',
          tagList: ['angularjs', 'javascript']
        }
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Dragons Article',
          description: 'About Dragons',
          body: 'Dragon content',
          tagList: ['dragons']
        }
      });

    // Get tags
    const response = await request(app).get('/api/tags').expect(200);

    expect(response.body.tags).toHaveLength(4);
    expect(response.body.tags).toEqual(
      expect.arrayContaining(['reactjs', 'angularjs', 'javascript', 'dragons'])
    );
  });

  it('returns tags only once even if used in multiple articles', async () => {
    // Create user
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    // Create multiple articles with same tag
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Article 1',
          description: 'Desc',
          body: 'Body',
          tagList: ['javascript']
        }
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Article 2',
          description: 'Desc',
          body: 'Body',
          tagList: ['javascript']
        }
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Article 3',
          description: 'Desc',
          body: 'Body',
          tagList: ['javascript']
        }
      });

    // Get tags
    const response = await request(app).get('/api/tags').expect(200);

    expect(response.body.tags).toEqual(['javascript']);
  });

  it('does not require authentication', async () => {
    const response = await request(app).get('/api/tags').expect(200);

    expect(response.body).toHaveProperty('tags');
  });
});
```

---

## Verification Protocol Check

**§1 Bounded** ✅
- Route handlers in `src/routes/tag.routes.ts` contain NO `prisma.` calls
- All database access delegated to `PrismaTagRepository`
- Services call repository interface only

**§2 Verifiable** ✅
Endpoint has tests:
- `GET /api/tags`: empty array, returns all unique tags, deduplicates tags, no auth required

**§3 Composable** ✅
- `TagService` receives `ITagRepository` via constructor injection
- No `new PrismaClient()` inside service
- Composition root in `src/app.ts` (updated)

**§4 Zero Hardcoded Values** ✅
- No magic numbers or strings
- All configuration from `env` module

**§5 Error Format** ✅
- All errors use `{"errors": {"body": ["message"]}}` format
- Centralized in `AppError.toJSON()` method

**§6 Defended** ✅
- `.husky/pre-commit` exists (emitted in P0)
- `.github/workflows/ci.yml` exists (emitted in P0) with Stryker mutation gate

**§7 Auditable** ✅
- ADRs exist (emitted in P0)
- `CHANGELOG.md` exists (emitted in P0)

---

## Summary

**Files created:** 4
**Endpoints implemented:** 1/1
- ✅ GET /api/tags (no auth required)

**Test coverage:**
- Unit tests: `tag.service.test.ts` (2 test cases)
- Integration tests: `tag.test.ts` (4 test cases)
- Total: 6 tests covering retrieval, empty state, deduplication, no auth

**Key patterns implemented:**
- Returns unique tags only (no duplicates)
- Tags are returned as array of strings
- No authentication required (public endpoint)
- Returns empty array (not 404) when no tags exist

All 7 verification protocol checks pass. Ready for commit.