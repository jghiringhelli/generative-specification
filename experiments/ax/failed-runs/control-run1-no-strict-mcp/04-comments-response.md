I've designed the complete comments implementation following the layered architecture. Since I can't write files directly, here's the full implementation you can create:

## **1. Domain Layer** — `src/domain/comment.ts`

```typescript
/**
 * Comment Domain Entity
 * Pure domain model with no external dependencies.
 */

export interface Comment {
  readonly id: number;
  readonly body: string;
  readonly articleId: number;
  readonly authorId: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateCommentData {
  readonly body: string;
  readonly articleId: number;
  readonly authorId: number;
}

export function createComment(data: CreateCommentData, id: number, now: Date = new Date()): Comment {
  if (!data.body || data.body.trim().length === 0) {
    throw new Error('Comment body cannot be empty');
  }
  
  return {
    id,
    body: data.body.trim(),
    articleId: data.articleId,
    authorId: data.authorId,
    createdAt: now,
    updatedAt: now,
  };
}
```

## **2. Port Interface** — `src/ports/comment-repository.ts`

```typescript
/**
 * Comment Repository Port
 * Abstract interface defined by domain, implemented by adapters.
 */

import { Comment, CreateCommentData } from '../domain/comment';

export interface CommentWithAuthor extends Comment {
  readonly author: {
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
    readonly following?: boolean;
  };
}

export interface CommentRepository {
  findByArticleId(articleId: number, currentUserId?: number): Promise<CommentWithAuthor[]>;
  create(data: CreateCommentData): Promise<CommentWithAuthor>;
  findById(id: number, currentUserId?: number): Promise<CommentWithAuthor | null>;
  deleteById(id: number): Promise<boolean>;
  belongsToAuthor(commentId: number, authorId: number): Promise<boolean>;
}
```

## **3. DTOs** — `src/dto/comment-dto.ts`

```typescript
/**
 * Comment Data Transfer Objects
 * API boundary contracts.
 */

export interface CommentResponseDTO {
  readonly id: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly body: string;
  readonly author: {
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
    readonly following: boolean;
  };
}

export interface CommentsResponseDTO {
  readonly comments: ReadonlyArray<CommentResponseDTO>;
}

export interface CreateCommentRequestDTO {
  readonly comment: {
    readonly body: string;
  };
}

export interface SingleCommentResponseDTO {
  readonly comment: CommentResponseDTO;
}
```

## **4. Service Layer** — `src/services/comment-service.ts`

```typescript
/**
 * Comment Service
 * Business logic orchestration. Depends on ports only.
 */

import { CommentRepository } from '../ports/comment-repository';
import { ArticleRepository } from '../ports/article-repository';
import { CommentResponseDTO, CommentsResponseDTO } from '../dto/comment-dto';
import { CreateCommentData } from '../domain/comment';

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly articleRepository: ArticleRepository
  ) {}

  async getCommentsByArticleSlug(
    slug: string,
    currentUserId?: number
  ): Promise<CommentsResponseDTO> {
    const article = await this.articleRepository.findBySlug(slug);
    
    if (!article) {
      throw new NotFoundError(`Article not found: ${slug}`);
    }

    const comments = await this.commentRepository.findByArticleId(
      article.id,
      currentUserId
    );

    return {
      comments: comments.map(this.toCommentResponseDTO),
    };
  }

  async addComment(
    slug: string,
    body: string,
    authorId: number
  ): Promise<CommentResponseDTO> {
    const article = await this.articleRepository.findBySlug(slug);
    
    if (!article) {
      throw new NotFoundError(`Article not found: ${slug}`);
    }

    const createData: CreateCommentData = {
      body,
      articleId: article.id,
      authorId,
    };

    const comment = await this.commentRepository.create(createData);
    return this.toCommentResponseDTO(comment);
  }

  async deleteComment(commentId: number, userId: number): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);
    
    if (!comment) {
      throw new NotFoundError(`Comment not found: ${commentId}`);
    }

    const isAuthor = await this.commentRepository.belongsToAuthor(commentId, userId);
    
    if (!isAuthor) {
      throw new ForbiddenError('You can only delete your own comments');
    }

    await this.commentRepository.deleteById(commentId);
  }

  private toCommentResponseDTO(comment: any): CommentResponseDTO {
    return {
      id: comment.id,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      body: comment.body,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following: comment.author.following ?? false,
      },
    };
  }
}
```

## **5. Repository Adapter** — `src/adapters/prisma-comment-repository.ts`

```typescript
/**
 * Prisma Comment Repository
 * Concrete implementation - DRIVEN adapter.
 */

import { PrismaClient } from '@prisma/client';
import { CommentRepository, CommentWithAuthor } from '../ports/comment-repository';
import { CreateCommentData } from '../domain/comment';

export class PrismaCommentRepository implements CommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByArticleId(
    articleId: number,
    currentUserId?: number
  ): Promise<CommentWithAuthor[]> {
    const comments = await this.prisma.comment.findMany({
      where: { articleId },
      include: {
        author: {
          include: {
            followedBy: currentUserId
              ? { where: { followerId: currentUserId }, select: { followerId: true } }
              : false,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments.map((c) => ({
      id: c.id,
      body: c.body,
      articleId: c.articleId,
      authorId: c.authorId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      author: {
        username: c.author.username,
        bio: c.author.bio,
        image: c.author.image,
        following: currentUserId ? c.author.followedBy.length > 0 : false,
      },
    }));
  }

  async create(data: CreateCommentData): Promise<CommentWithAuthor> {
    const comment = await this.prisma.comment.create({
      data: {
        body: data.body,
        articleId: data.articleId,
        authorId: data.authorId,
      },
      include: { author: true },
    });

    return {
      id: comment.id,
      body: comment.body,
      articleId: comment.articleId,
      authorId: comment.authorId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following: false,
      },
    };
  }

  async findById(id: number, currentUserId?: number): Promise<CommentWithAuthor | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          include: {
            followedBy: currentUserId
              ? { where: { followerId: currentUserId }, select: { followerId: true } }
              : false,
          },
        },
      },
    });

    if (!comment) return null;

    return {
      id: comment.id,
      body: comment.body,
      articleId: comment.articleId,
      authorId: comment.authorId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following: currentUserId ? comment.author.followedBy.length > 0 : false,
      },
    };
  }

  async deleteById(id: number): Promise<boolean> {
    try {
      await this.prisma.comment.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async belongsToAuthor(commentId: number, authorId: number): Promise<boolean> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });
    return comment?.authorId === authorId;
  }
}
```

## **6. API Routes** — `src/routes/comments.ts`

```typescript
/**
 * Comment Routes - DRIVING adapter
 * Thin layer: validation + delegation. NO prisma calls.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CommentService, NotFoundError, ForbiddenError, UnauthorizedError } from '../services/comment-service';

const CreateCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1, 'Comment body is required'),
  }),
});

interface AuthenticatedRequest extends Request {
  user?: { id: number; username: string };
}

export function createCommentRoutes(commentService: CommentService): Router {
  const router = Router();

  // GET /api/articles/:slug/comments
  router.get('/api/articles/:slug/comments', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const result = await commentService.getCommentsByArticleSlug(slug, req.user?.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/articles/:slug/comments
  router.post('/api/articles/:slug/comments', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const validationResult = CreateCommentSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(422).json({ errors: validationResult.error.flatten().fieldErrors });
      }

      const result = await commentService.addComment(slug, validationResult.data.comment.body, req.user!.id);
      res.status(201).json({ comment: result });
    } catch (error) {
      next(error);
    }
  });

  // DELETE /api/articles/:slug/comments/:id
  router.delete('/api/articles/:slug/comments/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const commentId = parseInt(req.params.id, 10);
      
      if (isNaN(commentId)) {
        return res.status(422).json({ errors: { id: ['Invalid comment ID'] } });
      }

      await commentService.deleteComment(commentId, req.user!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) throw new UnauthorizedError('Authentication required');
  next();
}

export function commentErrorHandler(error: Error, req: Request, res: Response, next: NextFunction): void {
  if (error instanceof NotFoundError) {
    return res.status(404).json({ errors: { message: [error.message] } });
  }
  if (error instanceof ForbiddenError) {
    return res.status(403).json({ errors: { message: [error.message] } });
  }
  if (error instanceof UnauthorizedError) {
    return res.status(401).json({ errors: { message: [error.message] } });
  }
  next(error);
}
```

## **7. Integration Tests** — `tests/integration/comments.test.ts`

```typescript
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/database';

describe('Comment API', () => {
  let testUser: any, otherUser: any, testArticle: any;

  beforeAll(async () => {
    testUser = await createTestUser('commenter@test.com', 'commenter');
    otherUser = await createTestUser('other@test.com', 'other');
    testArticle = await createTestArticle(testUser.id, 'test-article');
  });

  afterAll(async () => {
    await prisma.comment.deleteMany({});
    await prisma.article.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.comment.deleteMany({});
  });

  it('returns_empty_array_when_article_has_no_comments', async () => {
    const res = await request(app).get(`/api/articles/${testArticle.slug}/comments`).expect(200);
    expect(res.body).toEqual({ comments: [] });
  });

  it('lists_comments_unauthenticated', async () => {
    await createComment(testArticle.id, testUser.id, 'First comment');
    await createComment(testArticle.id, otherUser.id, 'Second comment');

    const res = await request(app).get(`/api/articles/${testArticle.slug}/comments`).expect(200);
    expect(res.body.comments).toHaveLength(2);
  });

  it('creates_comment_when_authenticated', async () => {
    const res = await request(app)
      .post(`/api/articles/${testArticle.slug}/comments`)
      .set('Authorization', `Token ${testUser.token}`)
      .send({ comment: { body: 'Great article!' } })
      .expect(201);

    expect(res.body.comment.body).toBe('Great article!');
    expect(res.body.comment.author.username).toBe(testUser.username);
  });

  it('rejects_comment_creation_without_authentication', async () => {
    await request(app)
      .post(`/api/articles/${testArticle.slug}/comments`)
      .send({ comment: { body: 'Unauthorized' } })
      .expect(401);
  });

  it('returns_404_when_commenting_on_non_existent_article', async () => {
    await request(app)
      .post('/api/articles/non-existent/comments')
      .set('Authorization', `Token ${testUser.token}`)
      .send({ comment: { body: 'Comment' } })
      .expect(404);
  });

  it('deletes_own_comment_successfully', async () => {
    const comment = await createComment(testArticle.id, testUser.id, 'My comment');

    await request(app)
      .delete(`/api/articles/${testArticle.slug}/comments/${comment.id}`)
      .set('Authorization', `Token ${testUser.token}`)
      .expect(204);

    const dbComment = await prisma.comment.findUnique({ where: { id: comment.id } });
    expect(dbComment).toBeNull();
  });

  it('rejects_deletion_of_another_users_comment', async () => {
    const comment = await createComment(testArticle.id, otherUser.id, 'Other comment');

    await request(app)
      .delete(`/api/articles/${testArticle.slug}/comments/${comment.id}`)
      .set('Authorization', `Token ${testUser.token}`)
      .expect(403);
  });

  it('rejects_comment_deletion_without_authentication', async () => {
    const comment = await createComment(testArticle.id, testUser.id, 'Comment');

    await request(app)
      .delete(`/api/articles/${testArticle.slug}/comments/${comment.id}`)
      .expect(401);
  });

  it('returns_404_when_deleting_non_existent_comment', async () => {
    await request(app)
      .delete(`/api/articles/${testArticle.slug}/comments/99999`)
      .set('Authorization', `Token ${testUser.token}`)
      .expect(404);
  });
});

// Helpers
async function createTestUser(email: string, username: string) {
  const user = await prisma.user.create({ data: { email, username, password: 'hashed' } });
  return { id: user.id, username: user.username, token: `test_token_${user.id}` };
}

async function createTestArticle(authorId: number, slug: string) {
  return prisma.article.create({ data: { slug, title: 'Test', description: 'Desc', body: 'Body', authorId } });
}

async function createComment(articleId: number, authorId: number, body: string) {
  return prisma.comment.create({ data: { articleId, authorId, body } });
}
```

## **Architecture Summary**

```
API Layer (routes/comments.ts)          ← Thin. Zod validation + delegation
    ↓
Service Layer (services/comment-service.ts)  ← Business logic
    ↓
Port Interface (ports/comment-repository.ts) ← Abstract contract
    ↓
Adapter (adapters/prisma-comment-repository.ts) ← Prisma implementation
```

**Key Principles Applied:**
- ✅ Routes never call `prisma` directly
- ✅ Service depends on abstractions (ports), not concrete implementations
- ✅ Domain models are pure (no I/O)
- ✅ DTOs at API boundary
- ✅ Custom error types with proper HTTP mapping
- ✅ All tests describe behavior, not implementation
- ✅ Guard clauses for early returns
- ✅ Immutable data structures (`readonly`)