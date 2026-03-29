---
nav_exclude: true
---

I'll implement the comments endpoints with service layer, repository implementation, routes, and comprehensive tests.

---

## Comments Implementation

```typescript
// src/services/CommentService.ts
import {
  ICommentRepository,
  CommentWithAuthor,
  CreateCommentData
} from '../repositories/ICommentRepository';
import { IArticleRepository } from '../repositories/IArticleRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { NotFoundError, AuthorizationError, ValidationError } from '../errors/AppError';

export interface CreateCommentDTO {
  body: string;
}

export interface CommentResponse {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  body: string;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

/**
 * Comment service - business logic for article comments.
 * Depends on ICommentRepository, IArticleRepository, IProfileRepository interfaces.
 */
export class CommentService {
  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly articleRepository: IArticleRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  /**
   * List all comments for an article.
   * @param slug - Article slug
   * @param currentUserId - Optional current user ID for following status
   * @returns Array of comments with author profiles
   * @throws NotFoundError if article not found
   */
  async getComments(slug: string, currentUserId?: number): Promise<CommentResponse[]> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new NotFoundError('Article');
    }

    const comments = await this.commentRepository.findByArticleId(article.id);

    // Enrich with following status for current user
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        let following = false;
        if (currentUserId) {
          following = await this.profileRepository.isFollowing(
            currentUserId,
            comment.authorId
          );
        }

        return {
          id: comment.id,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          body: comment.body,
          author: {
            username: comment.author.username,
            bio: comment.author.bio,
            image: comment.author.image,
            following
          }
        };
      })
    );

    return enrichedComments;
  }

  /**
   * Add a comment to an article.
   * @param slug - Article slug
   * @param dto - Comment creation data
   * @param authorId - Comment author user ID
   * @returns Created comment with author profile
   * @throws NotFoundError if article not found
   */
  async addComment(
    slug: string,
    dto: CreateCommentDTO,
    authorId: number
  ): Promise<CommentResponse> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new NotFoundError('Article');
    }

    if (!dto.body || dto.body.trim().length === 0) {
      throw new ValidationError('Comment body cannot be empty');
    }

    const comment = await this.commentRepository.create({
      body: dto.body,
      authorId,
      articleId: article.id
    });

    // Check if current user follows themselves (always false for self)
    const following = false;

    return {
      id: comment.id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      body: comment.body,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following
      }
    };
  }

  /**
   * Delete a comment.
   * @param slug - Article slug
   * @param commentId - Comment ID
   * @param userId - Current user ID (must be comment author)
   * @throws NotFoundError if article or comment not found
   * @throws AuthorizationError if user is not comment author
   */
  async deleteComment(slug: string, commentId: number, userId: number): Promise<void> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new NotFoundError('Article');
    }

    const comment = await this.commentRepository.findById(commentId);

    if (!comment) {
      throw new NotFoundError('Comment');
    }

    if (comment.articleId !== article.id) {
      throw new NotFoundError('Comment');
    }

    if (comment.authorId !== userId) {
      throw new AuthorizationError('Only the comment author can delete this comment');
    }

    await this.commentRepository.delete(commentId);
  }
}
```

```typescript
// src/repositories/PrismaCommentRepository.ts
import { PrismaClient } from '@prisma/client';
import {
  ICommentRepository,
  CommentWithAuthor,
  CreateCommentData
} from './ICommentRepository';

/**
 * Prisma implementation of ICommentRepository.
 * Single responsibility: translate Comment domain operations to Prisma ORM calls.
 */
export class PrismaCommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: number): Promise<CommentWithAuthor | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            bio: true,
            image: true
          }
        }
      }
    });

    if (!comment) {
      return null;
    }

    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      authorId: comment.authorId,
      articleId: comment.articleId,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image
      }
    };
  }

  async findByArticleId(articleId: number): Promise<CommentWithAuthor[]> {
    const comments = await this.prisma.comment.findMany({
      where: { articleId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            bio: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      authorId: comment.authorId,
      articleId: comment.articleId,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image
      }
    }));
  }

  async create(data: CreateCommentData): Promise<CommentWithAuthor> {
    const comment = await this.prisma.comment.create({
      data: {
        body: data.body,
        authorId: data.authorId,
        articleId: data.articleId
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            bio: true,
            image: true
          }
        }
      }
    });

    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      authorId: comment.authorId,
      articleId: comment.articleId,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image
      }
    };
  }

  async delete(id: number): Promise<void> {
    await this.prisma.comment.delete({
      where: { id }
    });
  }
}
```

```typescript
// src/routes/comments.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CommentService } from '../services/CommentService';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { ValidationError } from '../errors/AppError';

/**
 * Comment routes (nested under /api/articles/:slug).
 * Thin layer: parse input, call service, format response.
 */
export function createCommentRoutes(commentService: CommentService): Router {
  const router = Router({ mergeParams: true }); // mergeParams to access :slug from parent

  /**
   * GET /api/articles/:slug/comments - List comments (auth optional)
   */
  router.get(
    '/',
    optionalAuthenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { slug } = req.params;
        const currentUserId = req.user?.userId;

        const comments = await commentService.getComments(slug, currentUserId);

        res.status(200).json({ comments });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/articles/:slug/comments - Add comment (auth required)
   */
  router.post(
    '/',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new Error('User not attached by auth middleware');
        }

        const { slug } = req.params;

        const schema = z.object({
          comment: z.object({
            body: z.string().min(1, 'Comment body cannot be empty')
          })
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
          const errors = parsed.error.errors.map((e) => `${e.path.join('.')} ${e.message}`);
          throw new ValidationError(errors.join(', '));
        }

        const comment = await commentService.addComment(
          slug,
          parsed.data.comment,
          req.user.userId
        );

        res.status(201).json({ comment });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * DELETE /api/articles/:slug/comments/:id - Delete comment (auth required, author only)
   */
  router.delete(
    '/:id',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new Error('User not attached by auth middleware');
        }

        const { slug, id } = req.params;
        const commentId = parseInt(id, 10);

        if (isNaN(commentId)) {
          throw new ValidationError('Invalid comment ID');
        }

        await commentService.deleteComment(slug, commentId, req.user.userId);

        res.status(200).json({});
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
```

```typescript
// src/app.ts (updated to include comment routes)
import express, { Express } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler';
import { createUserRoutes } from './routes/users';
import { createProfileRoutes } from './routes/profiles';
import { createArticleRoutes } from './routes/articles';
import { createCommentRoutes } from './routes/comments';
import { PrismaUserRepository } from './repositories/PrismaUserRepository';
import { PrismaProfileRepository } from './repositories/PrismaProfileRepository';
import { PrismaArticleRepository } from './repositories/PrismaArticleRepository';
import { PrismaCommentRepository } from './repositories/PrismaCommentRepository';
import { UserService } from './services/UserService';
import { ProfileService } from './services/ProfileService';
import { ArticleService } from './services/ArticleService';
import { CommentService } from './services/CommentService';
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MINUTES } from './config/constants';

/**
 * Create Express application with all middleware and routes.
 * Dependency injection composition root.
 */
export function createApp(prisma: PrismaClient): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(
    rateLimit({
      windowMs: RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
      max: RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  // Dependency injection - composition root
  const userRepository = new PrismaUserRepository(prisma);
  const profileRepository = new PrismaProfileRepository(prisma);
  const articleRepository = new PrismaArticleRepository(prisma);
  const commentRepository = new PrismaCommentRepository(prisma);

  const userService = new UserService(userRepository);
  const profileService = new ProfileService(profileRepository, userRepository);
  const articleService = new ArticleService(articleRepository, userRepository, profileRepository);
  const commentService = new CommentService(commentRepository, articleRepository, profileRepository);

  // Routes
  app.use('/api/users', createUserRoutes(userService));

  // Note: /api/user routes are on the same router (singular vs plural distinction)
  const userRouter = createUserRoutes(userService);
  app.use('/api/user', userRouter);

  app.use('/api/profiles', createProfileRoutes(profileService));
  app.use('/api/articles', createArticleRoutes(articleService));

  // Comments are nested under articles
  app.use('/api/articles/:slug/comments', createCommentRoutes(commentService));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
```

---

## Tests

```typescript
// src/services/CommentService.test.ts
import { CommentService } from './CommentService';
import { ICommentRepository, CommentWithAuthor } from '../repositories/ICommentRepository';
import { IArticleRepository, ArticleWithRelations } from '../repositories/IArticleRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { NotFoundError, AuthorizationError, ValidationError } from '../errors/AppError';

/**
 * Mock implementations for comment service tests.
 */
class MockCommentRepository implements ICommentRepository {
  private comments: CommentWithAuthor[] = [];
  private nextId = 1;

  async findById(id: number): Promise<CommentWithAuthor | null> {
    return this.comments.find((c) => c.id === id) || null;
  }

  async findByArticleId(articleId: number): Promise<CommentWithAuthor[]> {
    return this.comments.filter((c) => c.articleId === articleId);
  }

  async create(data: {
    body: string;
    authorId: number;
    articleId: number;
  }): Promise<CommentWithAuthor> {
    const comment: CommentWithAuthor = {
      id: this.nextId++,
      body: data.body,
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId: data.authorId,
      articleId: data.articleId,
      author: {
        username: `user${data.authorId}`,
        bio: null,
        image: null
      }
    };
    this.comments.push(comment);
    return comment;
  }

  async delete(id: number): Promise<void> {
    this.comments = this.comments.filter((c) => c.id !== id);
  }

  reset(): void {
    this.comments = [];
    this.nextId = 1;
  }
}

class MockArticleRepository implements Partial<IArticleRepository> {
  private articles: ArticleWithRelations[] = [];

  async findBySlug(slug: string): Promise<ArticleWithRelations | null> {
    return this.articles.find((a) => a.slug === slug) || null;
  }

  addArticle(slug: string, authorId: number): ArticleWithRelations {
    const article: ArticleWithRelations = {
      id: this.articles.length + 1,
      slug,
      title: 'Test',
      description: 'Test',
      body: 'Test',
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId,
      author: { username: `user${authorId}`, bio: null, image: null, following: false },
      tags: [],
      favorited: false,
      favoritesCount: 0
    };
    this.articles.push(article);
    return article;
  }

  reset(): void {
    this.articles = [];
  }
}

class MockProfileRepository implements IProfileRepository {
  private follows: Set<string> = new Set();

  async findByUsername(): Promise<any> {
    return null;
  }

  async follow(): Promise<void> {}
  async unfollow(): Promise<void> {}

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    return this.follows.has(`${followerId}-${followingId}`);
  }

  addFollow(followerId: number, followingId: number): void {
    this.follows.add(`${followerId}-${followingId}`);
  }

  reset(): void {
    this.follows.clear();
  }
}

describe('CommentService', () => {
  let commentRepository: MockCommentRepository;
  let articleRepository: MockArticleRepository;
  let profileRepository: MockProfileRepository;
  let service: CommentService;

  beforeEach(() => {
    commentRepository = new MockCommentRepository();
    articleRepository = new MockArticleRepository() as any;
    profileRepository = new MockProfileRepository();
    service = new CommentService(commentRepository, articleRepository as any, profileRepository);
  });

  describe('getComments', () => {
    it('get_comments_for_existing_article_returns_comments_array', async () => {
      const article = articleRepository.addArticle('test-article', 1);
      await commentRepository.create({
        body: 'Great article!',
        authorId: 2,
        articleId: article.id
      });

      const comments = await service.getComments('test-article');

      expect(comments).toHaveLength(1);
      expect(comments[0].body).toBe('Great article!');
      expect(comments[0].author.username).toBe('user2');
      expect(comments[0].author.following).toBe(false);
    });

    it('get_comments_with_following_status_returns_enriched_comments', async () => {
      const article = articleRepository.addArticle('test-article', 1);
      await commentRepository.create({
        body: 'Comment',
        authorId: 2,
        articleId: article.id
      });
      profileRepository.addFollow(3, 2); // User 3 follows author 2

      const comments = await service.getComments('test-article', 3);

      expect(comments[0].author.following).toBe(true);
    });

    it('get_comments_for_nonexistent_article_throws_not_found_error', async () => {
      await expect(service.getComments('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('get_comments_for_article_with_no_comments_returns_empty_array', async () => {
      articleRepository.addArticle('test-article', 1);

      const comments = await service.getComments('test-article');

      expect(comments).toHaveLength(0);
    });
  });

  describe('addComment', () => {
    it('add_comment_to_existing_article_returns_comment', async () => {
      const article = articleRepository.addArticle('test-article', 1);

      const comment = await service.addComment('test-article', { body: 'Nice work!' }, 2);

      expect(comment.body).toBe('Nice work!');
      expect(comment.author.username).toBe('user2');
      expect(comment.id).toBeDefined();
    });

    it('add_comment_to_nonexistent_article_throws_not_found_error', async () => {
      await expect(
        service.addComment('nonexistent', { body: 'Comment' }, 1)
      ).rejects.toThrow(NotFoundError);
    });

    it('add_comment_with_empty_body_throws_validation_error', async () => {
      articleRepository.addArticle('test-article', 1);

      await expect(service.addComment('test-article', { body: '   ' }, 2)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('deleteComment', () => {
    it('delete_comment_by_author_succeeds', async () => {
      const article = articleRepository.addArticle('test-article', 1);
      const comment = await commentRepository.create({
        body: 'To be deleted',
        authorId: 2,
        articleId: article.id
      });

      await service.deleteComment('test-article', comment.id, 2);

      const found = await commentRepository.findById(comment.id);
      expect(found).toBeNull();
    });

    it('delete_comment_by_non_author_throws_authorization_error', async () => {
      const article = articleRepository.addArticle('test-article', 1);
      const comment = await commentRepository.create({
        body: 'Comment',
        authorId: 2,
        articleId: article.id
      });

      await expect(service.deleteComment('test-article', comment.id, 3)).rejects.toThrow(
        AuthorizationError
      );
    });

    it('delete_nonexistent_comment_throws_not_found_error', async () => {
      articleRepository.addArticle('test-article', 1);

      await expect(service.deleteComment('test-article', 999, 2)).rejects.toThrow(NotFoundError);
    });

    it('delete_comment_for_nonexistent_article_throws_not_found_error', async () => {
      await expect(service.deleteComment('nonexistent', 1, 2)).rejects.toThrow(NotFoundError);
    });

    it('delete_comment_from_different_article_throws_not_found_error', async () => {
      const article1 = articleRepository.addArticle('article-1', 1);
      articleRepository.addArticle('article-2', 1);
      const comment = await commentRepository.create({
        body: 'Comment on article 1',
        authorId: 2,
        articleId: article1.id
      });

      await expect(service.deleteComment('article-2', comment.id, 2)).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
```

```typescript
// tests/integration/comments.test.ts
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { Express } from 'express';

const prisma = new PrismaClient();
let app: Express;

beforeAll(async () => {
  app = createApp(prisma);
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.userFavorite.deleteMany();
  await prisma.userFollow.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.articleTag.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
});

async function createUser(username: string, email: string) {
  const response = await request(app)
    .post('/api/users')
    .send({
      user: {
        email,
        username,
        password: 'password123'
      }
    });
  return response.body.user.token;
}

async function createArticle(token: string, title: string) {
  const response = await request(app)
    .post('/api/articles')
    .set('Authorization', `Token ${token}`)
    .send({
      article: {
        title,
        description: 'Test description',
        body: 'Test body'
      }
    });
  return response.body.article.slug;
}

describe('GET /api/articles/:slug/comments', () => {
  let token: string;
  let slug: string;

  beforeEach(async () => {
    token = await createUser('jake', 'jake@jake.jake');
    slug = await createArticle(token, 'Test Article');
  });

  it('get_comments_for_article_with_no_comments_returns_empty_array', async () => {
    const response = await request(app).get(`/api/articles/${slug}/comments`);

    expect(response.status).toBe(200);
    expect(response.body.comments).toEqual([]);
  });

  it('get_comments_returns_array_of_comments_with_author', async () => {
    // Add a comment
    await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({
        comment: {
          body: 'Great article!'
        }
      });

    const response = await request(app).get(`/api/articles/${slug}/comments`);

    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(1);
    expect(response.body.comments[0].body).toBe('Great article!');
    expect(response.body.comments[0].author.username).toBe('jake');
    expect(response.body.comments[0].author.following).toBe(false);
    expect(response.body.comments[0].id).toBeDefined();
    expect(response.body.comments[0].createdAt).toBeDefined();
  });

  it('get_comments_with_following_status_shows_following_true', async () => {
    const aliceToken = await createUser('alice', 'alice@alice.alice');
    const bobToken = await createUser('bob', 'bob@bob.bob');

    // Bob creates article
    const bobSlug = await createArticle(bobToken, 'Bob Article');

    // Alice comments
    await request(app)
      .post(`/api/articles/${bobSlug}/comments`)
      .set('Authorization', `Token ${aliceToken}`)
      .send({
        comment: {
          body: 'Nice work Bob!'
        }
      });

    // Bob follows Alice
    await request(app)
      .post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${bobToken}`);

    // Bob gets comments (should show following=true for Alice)
    const response = await request(app)
      .get(`/api/articles/${bobSlug}/comments`)
      .set('Authorization', `Token ${bobToken}`);

    expect(response.status).toBe(200);
    expect(response.body.comments[0].author.following).toBe(true);
  });

  it('get_comments_for_nonexistent_article_returns_404', async () => {
    const response = await request(app).get('/api/articles/nonexistent-slug/comments');

    expect(response.status).toBe(404);
    expect(response.body.errors.body).toContain('Article not found');
  });
});

describe('POST /api/articles/:slug/comments', () => {
  let token: string;
  let slug: string;

  beforeEach(async () => {
    token = await createUser('jake', 'jake@jake.jake');
    slug = await createArticle(token, 'Test Article');
  });

  it('add_comment_with_valid_data_returns_201_with_comment', async () => {
    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({
        comment: {
          body: 'His name was my name too.'
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.comment.body).toBe('His name was my name too.');
    expect(response.body.comment.author.username).toBe('jake');
    expect(response.body.comment.id).toBeDefined();
    expect(response.body.comment.createdAt).toBeDefined();
    expect(response.body.comment.updatedAt).toBeDefined();
  });

  it('add_comment_without_auth_returns_401', async () => {
    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .send({
        comment: {
          body: 'Unauthorized comment'
        }
      });

    expect(response.status).toBe(401);
  });

  it('add_comment_with_empty_body_returns_422', async () => {
    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({
        comment: {
          body: ''
        }
      });

    expect(response.status).toBe(422);
  });

  it('add_comment_without_body_field_returns_422', async () => {
    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({
        comment: {}
      });

    expect(response.status).toBe(422);
  });

  it('add_comment_to_nonexistent_article_returns_404', async () => {
    const response = await request(app)
      .post('/api/articles/nonexistent-slug/comments')
      .set('Authorization', `Token ${token}`)
      .send({
        comment: {
          body: 'Comment on nothing'
        }
      });

    expect(response.status).toBe(404);
  });

  it('add_multiple_comments_returns_all_in_get_request', async () => {
    await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({
        comment: {
          body: 'First comment'
        }
      });

    await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({
        comment: {
          body: 'Second comment'
        }
      });

    const response = await request(app).get(`/api/articles/${slug}/comments`);

    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(2);
  });
});

describe('DELETE /api/articles/:slug/comments/:id', () => {
  let authorToken: string;
  let otherToken: string;
  let slug: string;
  let commentId: number;

  beforeEach(async () => {
    authorToken = await createUser('jake', 'jake@jake.jake');
    otherToken = await createUser('alice', 'alice@alice.alice');
    slug = await createArticle(authorToken, 'Test Article');

    const commentResponse = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${authorToken}`)
      .send({
        comment: {
          body: 'Comment to delete'
        }
      });

    commentId = commentResponse.body.comment.id;
  });

  it('delete_comment_by_author_returns_200', async () => {
    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', `Token ${authorToken}`);

    expect(response.status).toBe(200);

    // Verify deletion
    const getResponse = await request(app).get(`/api/articles/${slug}/comments`);
    expect(getResponse.body.comments).toHaveLength(0);
  });

  it('delete_comment_by_non_author_returns_403', async () => {
    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', `Token ${otherToken}`);

    expect(response.status).toBe(403);
    expect(response.body.errors.body).toContain('Only the comment author can delete this comment');
  });

  it('delete_comment_without_auth_returns_401', async () => {
    const response = await request(app).delete(`/api/articles/${slug}/comments/${commentId}`);

    expect(response.status).toBe(401);
  });

  it('delete_nonexistent_comment_returns_404', async () => {
    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/99999`)
      .set('Authorization', `Token ${authorToken}`);

    expect(response.status).toBe(404);
    expect(response.body.errors.body).toContain('Comment not found');
  });

  it('delete_comment_from_nonexistent_article_returns_404', async () => {
    const response = await request(app)
      .delete(`/api/articles/nonexistent-slug/comments/${commentId}`)
      .set('Authorization', `Token ${authorToken}`);

    expect(response.status).toBe(404);
    expect(response.body.errors.body).toContain('Article not found');
  });

  it('delete_comment_with_invalid_id_format_returns_422', async () => {
    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/not-a-number`)
      .set('Authorization', `Token ${authorToken}`);

    expect(response.status).toBe(422);
  });
});
```

---

## Verification Protocol

Running through the 5 required checks:

### ✅ 1. Bounded
- Route handlers in `src/routes/comments.ts` contain **zero** `prisma.` calls
- All handlers call `commentService` methods only
- Service calls `commentRepository`, `articleRepository`, and `profileRepository` methods only
- Repository implementation (`PrismaCommentRepository`) is the only layer touching Prisma

### ✅ 2. Verifiable
All 3 endpoints have comprehensive tests:
- **GET /api/articles/:slug/comments**: empty array, comments with author, following status enrichment, nonexistent article (404)
- **POST /api/articles/:slug/comments**: success (201), no auth (401), empty body (422), missing body field (422), nonexistent article (404), multiple comments
- **DELETE /api/articles/:slug/comments/:id**: success by author, non-author (403), no auth (401), nonexistent comment (404), nonexistent article (404), invalid ID format (422)

Test names describe behavior clearly (e.g., `delete_comment_by_non_author_returns_403`)

Total: 12 unit tests + 16 integration tests = 28 tests

### ✅ 3. Composable
- `CommentService` receives `ICommentRepository`, `IArticleRepository`, `IProfileRepository` via constructor injection
- No `new PrismaClient()` inside service
- Composition root in `src/app.ts` wires all dependencies

### ✅ 4. Zero Hardcoded Values
- No new magic numbers or hardcoded strings introduced
- All constants reused from previous implementations
- All configuration from environment variables

### ✅ 5. Error Format
- All error responses use `{"errors": {"body": ["message"]}}` format
- Enforced by existing `errorHandler` middleware
- 401, 403, 404, 422 all use correct format

---

## Summary

**Implemented:**
- GET /api/articles/:slug/comments (auth optional)
- POST /api/articles/:slug/comments (auth required)
- DELETE /api/articles/:slug/comments/:id (auth required, author only)

**Key features:**
- Comments nested under article routes
- Following status enrichment for comment authors
- Author-only authorization for deletion
- Proper error handling for missing articles/comments
- Comments ordered by creation date (newest first)

**Files created:**
- Service: CommentService with business logic
- Repository: PrismaCommentRepository (Prisma implementation)
- Routes: comments.ts (thin HTTP layer, nested routes)
- Tests: CommentService.test.ts (12 unit tests), comments.test.ts (16 integration tests)

**Files modified:**
- src/app.ts - added CommentService dependency injection and nested routes

**Test coverage:**
- 12 unit tests for CommentService
- 16 integration tests for comment endpoints
- Total: 28 new tests

All 5 Verification Protocol checks pass. Ready for commit with message:
```
feat(comments): implement article comments endpoints

- GET /api/articles/:slug/comments (auth optional)
- POST /api/articles/:slug/comments (auth required)
- DELETE /api/articles/:slug/comments/:id (author only)
- Following status enrichment for comment authors
- Author authorization for deletion
- Full test coverage (28 tests)
```