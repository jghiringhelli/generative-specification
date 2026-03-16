I notice I don't have access to file editing tools in this environment. I'll provide the complete implementation as code blocks that you can apply to your codebase.

## Implementation Plan

Following the layered architecture pattern, I'll create:

1. **Domain layer**: DTOs and types
2. **Port layer**: Interface contracts
3. **Service layer**: Business logic
4. **Repository layer**: Prisma adapter
5. **API layer**: Route handlers with validation
6. **Tests**: Integration tests

---

## 1. Domain DTOs

**src/modules/articles/domain/article.dto.ts**

```typescript
export interface CreateArticleDTO {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
}

export interface UpdateArticleDTO {
  title?: string;
  description?: string;
  body?: string;
  tagList?: string[];
}

export interface ArticleDTO {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: ArticleAuthorDTO;
}

export interface ArticleListItemDTO {
  slug: string;
  title: string;
  description: string;
  // body omitted per spec change 2024-08-16
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: ArticleAuthorDTO;
}

export interface ArticleAuthorDTO {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface ArticleListResponseDTO {
  articles: ArticleListItemDTO[];
  articlesCount: number;
}

export interface ArticleFilters {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
}
```

---

## 2. Port Interfaces

**src/modules/articles/ports/article.repository.port.ts**

```typescript
import {
  CreateArticleDTO,
  UpdateArticleDTO,
  ArticleDTO,
  ArticleListItemDTO,
  ArticleFilters,
} from '../domain/article.dto';

export interface ArticleRepositoryPort {
  /**
   * Create a new article
   */
  create(userId: string, data: CreateArticleDTO): Promise<ArticleDTO>;

  /**
   * Find article by slug with optional viewer context
   */
  findBySlug(slug: string, viewerId?: string): Promise<ArticleDTO | null>;

  /**
   * Update article by slug
   */
  update(slug: string, data: UpdateArticleDTO): Promise<ArticleDTO>;

  /**
   * Delete article by slug
   */
  delete(slug: string): Promise<void>;

  /**
   * List articles with filters and pagination
   */
  list(
    filters: ArticleFilters,
    viewerId?: string
  ): Promise<{ articles: ArticleListItemDTO[]; count: number }>;

  /**
   * Get feed of articles from followed users
   */
  getFeed(
    userId: string,
    limit: number,
    offset: number
  ): Promise<{ articles: ArticleListItemDTO[]; count: number }>;

  /**
   * Add article to favorites
   */
  favorite(slug: string, userId: string): Promise<ArticleDTO>;

  /**
   * Remove article from favorites
   */
  unfavorite(slug: string, userId: string): Promise<ArticleDTO>;

  /**
   * Check if user is the author of article
   */
  isAuthor(slug: string, userId: string): Promise<boolean>;
}
```

---

## 3. Service Layer

**src/modules/articles/services/article.service.ts**

```typescript
import { ArticleRepositoryPort } from '../ports/article.repository.port';
import {
  CreateArticleDTO,
  UpdateArticleDTO,
  ArticleDTO,
  ArticleListResponseDTO,
  ArticleFilters,
} from '../domain/article.dto';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../../shared/errors';

export class ArticleService {
  constructor(private readonly articleRepository: ArticleRepositoryPort) {}

  async createArticle(
    userId: string,
    data: CreateArticleDTO
  ): Promise<ArticleDTO> {
    return this.articleRepository.create(userId, data);
  }

  async getArticle(slug: string, viewerId?: string): Promise<ArticleDTO> {
    const article = await this.articleRepository.findBySlug(slug, viewerId);
    if (!article) {
      throw new NotFoundError('Article not found');
    }
    return article;
  }

  async updateArticle(
    slug: string,
    userId: string,
    data: UpdateArticleDTO
  ): Promise<ArticleDTO> {
    const isAuthor = await this.articleRepository.isAuthor(slug, userId);
    if (!isAuthor) {
      throw new ForbiddenError('Only the author can update this article');
    }
    return this.articleRepository.update(slug, data);
  }

  async deleteArticle(slug: string, userId: string): Promise<void> {
    const isAuthor = await this.articleRepository.isAuthor(slug, userId);
    if (!isAuthor) {
      throw new ForbiddenError('Only the author can delete this article');
    }
    await this.articleRepository.delete(slug);
  }

  async listArticles(
    filters: ArticleFilters,
    viewerId?: string
  ): Promise<ArticleListResponseDTO> {
    this.validatePagination(filters.limit, filters.offset);
    
    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;

    const { articles, count } = await this.articleRepository.list(
      { ...filters, limit, offset },
      viewerId
    );

    return {
      articles,
      articlesCount: count,
    };
  }

  async getFeed(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<ArticleListResponseDTO> {
    const validatedLimit = limit ?? 20;
    const validatedOffset = offset ?? 0;

    this.validatePagination(validatedLimit, validatedOffset);

    const { articles, count } = await this.articleRepository.getFeed(
      userId,
      validatedLimit,
      validatedOffset
    );

    return {
      articles,
      articlesCount: count,
    };
  }

  async favoriteArticle(
    slug: string,
    userId: string
  ): Promise<ArticleDTO> {
    return this.articleRepository.favorite(slug, userId);
  }

  async unfavoriteArticle(
    slug: string,
    userId: string
  ): Promise<ArticleDTO> {
    return this.articleRepository.unfavorite(slug, userId);
  }

  private validatePagination(
    limit?: number,
    offset?: number
  ): void {
    if (limit !== undefined && (limit < 0 || !Number.isInteger(limit))) {
      throw new ValidationError('Limit must be a non-negative integer');
    }
    if (offset !== undefined && (offset < 0 || !Number.isInteger(offset))) {
      throw new ValidationError('Offset must be a non-negative integer');
    }
  }
}
```

---

## 4. Repository (Prisma Adapter)

**src/modules/articles/adapters/article.repository.prisma.ts**

```typescript
import { PrismaClient } from '@prisma/client';
import { ArticleRepositoryPort } from '../ports/article.repository.port';
import {
  CreateArticleDTO,
  UpdateArticleDTO,
  ArticleDTO,
  ArticleListItemDTO,
  ArticleFilters,
} from '../domain/article.dto';
import { NotFoundError } from '../../../shared/errors';

export class PrismaArticleRepository implements ArticleRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async create(userId: string, data: CreateArticleDTO): Promise<ArticleDTO> {
    const slug = this.generateSlug(data.title);

    const article = await this.prisma.article.create({
      data: {
        slug,
        title: data.title,
        description: data.description,
        body: data.body,
        authorId: userId,
        tags: {
          connectOrCreate: data.tagList?.map((name) => ({
            where: { name },
            create: { name },
          })) ?? [],
        },
      },
      include: this.getIncludeClause(userId),
    });

    return this.mapToArticleDTO(article, userId);
  }

  async findBySlug(
    slug: string,
    viewerId?: string
  ): Promise<ArticleDTO | null> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: this.getIncludeClause(viewerId),
    });

    if (!article) return null;
    return this.mapToArticleDTO(article, viewerId);
  }

  async update(slug: string, data: UpdateArticleDTO): Promise<ArticleDTO> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw new NotFoundError('Article not found');
    }

    const newSlug = data.title ? this.generateSlug(data.title) : slug;

    const updated = await this.prisma.article.update({
      where: { slug },
      data: {
        ...(data.title && { title: data.title, slug: newSlug }),
        ...(data.description && { description: data.description }),
        ...(data.body && { body: data.body }),
        ...(data.tagList && {
          tags: {
            set: [],
            connectOrCreate: data.tagList.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        }),
      },
      include: this.getIncludeClause(article.authorId),
    });

    return this.mapToArticleDTO(updated, article.authorId);
  }

  async delete(slug: string): Promise<void> {
    await this.prisma.article.delete({ where: { slug } });
  }

  async list(
    filters: ArticleFilters,
    viewerId?: string
  ): Promise<{ articles: ArticleListItemDTO[]; count: number }> {
    const where = this.buildWhereClause(filters);

    const [articles, count] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: this.getIncludeClause(viewerId),
        orderBy: { createdAt: 'desc' },
        take: filters.limit,
        skip: filters.offset,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      articles: articles.map((article) =>
        this.mapToArticleListItemDTO(article, viewerId)
      ),
      count,
    };
  }

  async getFeed(
    userId: string,
    limit: number,
    offset: number
  ): Promise<{ articles: ArticleListItemDTO[]; count: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { following: { select: { id: true } } },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const followingIds = user.following.map((u) => u.id);

    const where = {
      authorId: { in: followingIds },
    };

    const [articles, count] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: this.getIncludeClause(userId),
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      articles: articles.map((article) =>
        this.mapToArticleListItemDTO(article, userId)
      ),
      count,
    };
  }

  async favorite(slug: string, userId: string): Promise<ArticleDTO> {
    const article = await this.prisma.article.update({
      where: { slug },
      data: {
        favoritedBy: { connect: { id: userId } },
      },
      include: this.getIncludeClause(userId),
    });

    return this.mapToArticleDTO(article, userId);
  }

  async unfavorite(slug: string, userId: string): Promise<ArticleDTO> {
    const article = await this.prisma.article.update({
      where: { slug },
      data: {
        favoritedBy: { disconnect: { id: userId } },
      },
      include: this.getIncludeClause(userId),
    });

    return this.mapToArticleDTO(article, userId);
  }

  async isAuthor(slug: string, userId: string): Promise<boolean> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { authorId: true },
    });

    return article?.authorId === userId;
  }

  private generateSlug(title: string): string {
    const kebab = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const timestamp = Date.now();
    return `${kebab}-${timestamp}`;
  }

  private buildWhereClause(filters: ArticleFilters) {
    const where: any = {};

    if (filters.tag) {
      where.tags = { some: { name: filters.tag } };
    }

    if (filters.author) {
      where.author = { username: filters.author };
    }

    if (filters.favorited) {
      where.favoritedBy = { some: { username: filters.favorited } };
    }

    return where;
  }

  private getIncludeClause(viewerId?: string) {
    return {
      author: {
        include: {
          followers: viewerId ? { where: { id: viewerId } } : false,
        },
      },
      tags: true,
      favoritedBy: viewerId ? { where: { id: viewerId } } : { take: 0 },
      _count: { select: { favoritedBy: true } },
    };
  }

  private mapToArticleDTO(article: any, viewerId?: string): ArticleDTO {
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tags.map((tag: any) => tag.name),
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited: viewerId ? article.favoritedBy.length > 0 : false,
      favoritesCount: article._count.favoritedBy,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following: viewerId
          ? article.author.followers.some((f: any) => f.id === viewerId)
          : false,
      },
    };
  }

  private mapToArticleListItemDTO(
    article: any,
    viewerId?: string
  ): ArticleListItemDTO {
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      // body omitted per spec change 2024-08-16
      tagList: article.tags.map((tag: any) => tag.name),
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited: viewerId ? article.favoritedBy.length > 0 : false,
      favoritesCount: article._count.favoritedBy,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following: viewerId
          ? article.author.followers.some((f: any) => f.id === viewerId)
          : false,
      },
    };
  }
}
```

---

## 5. API Routes

**src/modules/articles/routes/article.routes.ts**

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { ArticleService } from '../services/article.service';
import { authenticate, optionalAuth } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { asyncHandler } from '../../../shared/async-handler';

const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    body: z.string().min(1),
    tagList: z.array(z.string()).optional(),
  }),
});

const updateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
    tagList: z.array(z.string()).optional(),
  }),
});

const listArticlesSchema = z.object({
  tag: z.string().optional(),
  author: z.string().optional(),
  favorited: z.string().optional(),
  limit: z.coerce.number().int().nonnegative().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

const feedSchema = z.object({
  limit: z.coerce.number().int().nonnegative().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export function createArticleRoutes(service: ArticleService): Router {
  const router = Router();

  router.get(
    '/',
    optionalAuth,
    validate(listArticlesSchema, 'query'),
    asyncHandler(async (req, res) => {
      const filters = req.query;
      const viewerId = req.user?.id;

      const result = await service.listArticles(filters, viewerId);

      res.json(result);
    })
  );

  router.get(
    '/feed',
    authenticate,
    validate(feedSchema, 'query'),
    asyncHandler(async (req, res) => {
      const { limit, offset } = req.query;
      const userId = req.user!.id;

      const result = await service.getFeed(userId, limit, offset);

      res.json(result);
    })
  );

  router.get(
    '/:slug',
    optionalAuth,
    asyncHandler(async (req, res) => {
      const { slug } = req.params;
      const viewerId = req.user?.id;

      const article = await service.getArticle(slug, viewerId);

      res.json({ article });
    })
  );

  router.post(
    '/',
    authenticate,
    validate(createArticleSchema, 'body'),
    asyncHandler(async (req, res) => {
      const userId = req.user!.id;
      const { article: data } = req.body;

      const article = await service.createArticle(userId, data);

      res.status(201).json({ article });
    })
  );

  router.put(
    '/:slug',
    authenticate,
    validate(updateArticleSchema, 'body'),
    asyncHandler(async (req, res) => {
      const { slug } = req.params;
      const userId = req.user!.id;
      const { article: data } = req.body;

      const article = await service.updateArticle(slug, userId, data);

      res.json({ article });
    })
  );

  router.delete(
    '/:slug',
    authenticate,
    asyncHandler(async (req, res) => {
      const { slug } = req.params;
      const userId = req.user!.id;

      await service.deleteArticle(slug, userId);

      res.status(204).send();
    })
  );

  router.post(
    '/:slug/favorite',
    authenticate,
    asyncHandler(async (req, res) => {
      const { slug } = req.params;
      const userId = req.user!.id;

      const article = await service.favoriteArticle(slug, userId);

      res.json({ article });
    })
  );

  router.delete(
    '/:slug/favorite',
    authenticate,
    asyncHandler(async (req, res) => {
      const { slug } = req.params;
      const userId = req.user!.id;

      const article = await service.unfavoriteArticle(slug, userId);

      res.json({ article });
    })
  );

  return router;
}
```

---

## 6. Integration Tests

**src/modules/articles/tests/article.integration.test.ts**

```typescript
import request from 'supertest';
import { app } from '../../../app';
import { prisma } from '../../../shared/db';
import { generateToken } from '../../../shared/jwt';

describe('Articles API', () => {
  let authToken: string;
  let userId: string;
  let otherToken: string;
  let otherUserId: string;

  beforeAll(async () => {
    // Create test users
    const user = await prisma.user.create({
      data: {
        email: 'article-author@test.com',
        username: 'articleauthor',
        password: 'hashed',
      },
    });
    userId = user.id;
    authToken = generateToken(user.id);

    const otherUser = await prisma.user.create({
      data: {
        email: 'other@test.com',
        username: 'otheruser',
        password: 'hashed',
      },
    });
    otherUserId = otherUser.id;
    otherToken = generateToken(otherUser.id);
  });

  afterAll(async () => {
    await prisma.article.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await prisma.article.deleteMany();
  });

  describe('POST /api/articles', () => {
    it('creates article when authenticated', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          article: {
            title: 'Test Article',
            description: 'Test description',
            body: 'Test body content',
            tagList: ['test', 'nodejs'],
          },
        })
        .expect(201);

      expect(response.body.article).toMatchObject({
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body content',
        tagList: ['test', 'nodejs'],
        author: { username: 'articleauthor' },
      });
      expect(response.body.article.slug).toContain('test-article');
    });

    it('returns 401 when not authenticated', async () => {
      await request(app)
        .post('/api/articles')
        .send({
          article: {
            title: 'Test',
            description: 'Test',
            body: 'Test',
          },
        })
        .expect(401);
    });
  });

  describe('GET /api/articles', () => {
    beforeEach(async () => {
      await prisma.article.createMany({
        data: [
          {
            slug: 'article-1',
            title: 'Article 1',
            description: 'Desc 1',
            body: 'Body 1',
            authorId: userId,
          },
          {
            slug: 'article-2',
            title: 'Article 2',
            description: 'Desc 2',
            body: 'Body 2',
            authorId: otherUserId,
          },
        ],
      });
    });

    it('lists articles without authentication', async () => {
      const response = await request(app)
        .get('/api/articles')
        .expect(200);

      expect(response.body.articlesCount).toBe(2);
      expect(response.body.articles).toHaveLength(2);
      expect(response.body.articles[0]).not.toHaveProperty('body');
    });

    it('filters articles by tag', async () => {
      const tag = await prisma.tag.create({ data: { name: 'testing' } });
      await prisma.article.update({
        where: { slug: 'article-1' },
        data: { tags: { connect: { id: tag.id } } },
      });

      const response = await request(app)
        .get('/api/articles?tag=testing')
        .expect(200);

      expect(response.body.articlesCount).toBe(1);
      expect(response.body.articles[0].slug).toBe('article-1');
    });

    it('filters articles by author username', async () => {
      const response = await request(app)
        .get('/api/articles?author=articleauthor')
        .expect(200);

      expect(response.body.articlesCount).toBe(1);
      expect(response.body.articles[0].author.username).toBe('articleauthor');
    });

    it('filters articles by favorited username', async () => {
      await prisma.article.update({
        where: { slug: 'article-1' },
        data: { favoritedBy: { connect: { id: otherUserId } } },
      });

      const response = await request(app)
        .get('/api/articles?favorited=otheruser')
        .expect(200);

      expect(response.body.articlesCount).toBe(1);
      expect(response.body.articles[0].slug).toBe('article-1');
    });

    it('paginates articles with custom limit and offset', async () => {
      const response = await request(app)
        .get('/api/articles?limit=1&offset=1')
        .expect(200);

      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articlesCount).toBe(2);
    });

    it('uses default pagination when not specified', async () => {
      // Create 25 articles to test default limit
      const articles = Array.from({ length: 25 }, (_, i) => ({
        slug: `article-${i}`,
        title: `Article ${i}`,
        description: `Desc ${i}`,
        body: `Body ${i}`,
        authorId: userId,
      }));
      await prisma.article.deleteMany();
      await prisma.article.createMany({ data: articles });

      const response = await request(app)
        .get('/api/articles')
        .expect(200);

      expect(response.body.articles).toHaveLength(20);
      expect(response.body.articlesCount).toBe(25);
    });

    it('returns 422 for negative limit', async () => {
      await request(app)
        .get('/api/articles?limit=-1')
        .expect(422);
    });

    it('returns 422 for negative offset', async () => {
      await request(app)
        .get('/api/articles?offset=-1')
        .expect(422);
    });
  });

  describe('GET /api/articles/feed', () => {
    beforeEach(async () => {
      // User follows otherUser
      await prisma.user.update({
        where: { id: userId },
        data: { following: { connect: { id: otherUserId } } },
      });

      await prisma.article.createMany({
        data: [
          {
            slug: 'feed-article-1',
            title: 'Feed Article 1',
            description: 'From followed user',
            body: 'Body',
            authorId: otherUserId,
          },
          {
            slug: 'feed-article-2',
            title: 'Feed Article 2',
            description: 'From self',
            body: 'Body',
            authorId: userId,
          },
        ],
      });
    });

    it('returns articles from followed users when authenticated', async () => {
      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.articlesCount).toBe(1);
      expect(response.body.articles[0].author.username).toBe('otheruser');
      expect(response.body.articles[0]).not.toHaveProperty('body');
    });

    it('returns 401 when not authenticated', async () => {
      await request(app)
        .get('/api/articles/feed')
        .expect(401);
    });

    it('paginates feed with custom limit and offset', async () => {
      const response = await request(app)
        .get('/api/articles/feed?limit=10&offset=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.articles).toBeDefined();
    });
  });

  describe('GET /api/articles/:slug', () => {
    beforeEach(async () => {
      await prisma.article.create({
        data: {
          slug: 'test-slug',
          title: 'Test',
          description: 'Test',
          body: 'Full body content',
          authorId: userId,
        },
      });
    });

    it('returns single article by slug', async () => {
      const response = await request(app)
        .get('/api/articles/test-slug')
        .expect(200);

      expect(response.body.article).toMatchObject({
        slug: 'test-slug',
        title: 'Test',
        body: 'Full body content',
      });
    });

    it('returns 404 for non-existent slug', async () => {
      await request(app)
        .get('/api/articles/nonexistent')
        .expect(404);
    });
  });

  describe('PUT /api/articles/:slug', () => {
    beforeEach(async () => {
      await prisma.article.create({
        data: {
          slug: 'update-test',
          title: 'Original Title',
          description: 'Original',
          body: 'Original',
          authorId: userId,
        },
      });
    });

    it('updates article when user is author', async () => {
      const response = await request(app)
        .put('/api/articles/update-test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          article: {
            title: 'Updated Title',
            description: 'Updated description',
          },
        })
        .expect(200);

      expect(response.body.article.title).toBe('Updated Title');
      expect(response.body.article.description).toBe('Updated description');
    });

    it('returns 403 when user is not the author', async () => {
      await request(app)
        .put('/api/articles/update-test')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          article: { title: 'Hacked' },
        })
        .expect(403);
    });

    it('returns 401 when not authenticated', async () => {
      await request(app)
        .put('/api/articles/update-test')
        .send({
          article: { title: 'Hacked' },
        })
        .expect(401);
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    beforeEach(async () => {
      await prisma.article.create({
        data: {
          slug: 'delete-test',
          title: 'To Delete',
          description: 'Test',
          body: 'Test',
          authorId: userId,
        },
      });
    });

    it('deletes article when user is author', async () => {
      await request(app)
        .delete('/api/articles/delete-test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      const article = await prisma.article.findUnique({
        where: { slug: 'delete-test' },
      });
      expect(article).toBeNull();
    });

    it('returns 403 when user is not the author', async () => {
      await request(app)
        .delete('/api/articles/delete-test')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('returns 401 when not authenticated', async () => {
      await request(app)
        .delete('/api/articles/delete-test')
        .expect(401);
    });
  });

  describe('POST /api/articles/:slug/favorite', () => {
    beforeEach(async () => {
      await prisma.article.create({
        data: {
          slug: 'favorite-test',
          title: 'Test',
          description: 'Test',
          body: 'Test',
          authorId: otherUserId,
        },
      });
    });

    it('favorites article when authenticated', async () => {
      const response = await request(app)
        .post('/api/articles/favorite-test/favorite')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.article.favorited).toBe(true);
      expect(response.body.article.favoritesCount).toBe(1);
    });

    it('returns 401 when not authenticated', async () => {
      await request(app)
        .post('/api/articles/favorite-test/favorite')
        .expect(401);
    });
  });

  describe('DELETE /api/articles/:slug/favorite', () => {
    beforeEach(async () => {
      await prisma.article.create({
        data: {
          slug: 'unfavorite-test',
          title: 'Test',
          description: 'Test',
          body: 'Test',
          authorId: otherUserId,
          favoritedBy: { connect: { id: userId } },
        },
      });
    });

    it('unfavorites article when authenticated', async () => {
      const response = await request(app)
        .delete('/api/articles/unfavorite-test/favorite')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.article.favorited).toBe(false);
      expect(response.body.article.favoritesCount).toBe(0);
    });

    it('returns 401 when not authenticated', async () => {
      await request(app)
        .delete('/api/articles/unfavorite-test/favorite')
        .expect(401);
    });
  });
});
```

---

## File Structure

```
src/modules/articles/
├── domain/
│   └── article.dto.ts
├── ports/
│   └── article.repository.port.ts
├── services/
│   └── article.service.ts
├── adapters/
│   └── article.repository.prisma.ts
├── routes/
│   └── article.routes.ts
└── tests/
    └── article.integration.test.ts
```

## Integration Points

Update your main app file to wire the dependencies:

```typescript
// In your app setup/DI container
import { PrismaClient } from '@prisma/client';
import { PrismaArticleRepository } from './modules/articles/adapters/article.repository.prisma';
import { ArticleService } from './modules/articles/services/article.service';
import { createArticleRoutes } from './modules/articles/routes/article.routes';

const prisma = new PrismaClient();
const articleRepository = new PrismaArticleRepository(prisma);
const articleService = new ArticleService(articleRepository);
const articleRouter = createArticleRoutes(articleService);

app.use('/api/articles', articleRouter);
```

This implementation follows all the architecture principles from CLAUDE.md:
- ✅ Ports & Adapters pattern
- ✅ Dependency injection
- ✅ No Prisma calls in routes
- ✅ DTOs at layer boundaries
- ✅ Guard clauses and early returns
- ✅ Command-Query Separation
- ✅ Proper error handling
- ✅ Functions under 50 lines
- ✅ Comprehensive integration tests
- ✅ Test names describe behavior