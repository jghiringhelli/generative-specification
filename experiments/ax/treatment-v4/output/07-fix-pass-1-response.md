I'll fix all compilation errors and the Jest configuration conflict.

## Missing Repository Interface Files

```typescript
// src/repositories/IArticleRepository.ts

/**
 * Article repository port interface.
 */
export interface IArticleRepository {
  /**
   * Find article by unique slug.
   * @param slug - URL-friendly article identifier
   * @param currentUserId - Optional user ID to include favorited status
   * @returns Article with author, tags, and favorited status, or null
   */
  findBySlug(slug: string, currentUserId?: number): Promise<ArticleEntity | null>;

  /**
   * Check if slug already exists.
   * @param slug - Slug to check
   * @returns true if slug exists
   */
  slugExists(slug: string): Promise<boolean>;

  /**
   * Create a new article.
   * @param data - Article creation data
   * @returns Created article with author and tags
   */
  create(data: CreateArticleData): Promise<ArticleEntity>;

  /**
   * Update an existing article.
   * @param slug - Current article slug
   * @param data - Update data (may include new title → new slug)
   * @returns Updated article
   */
  update(slug: string, data: UpdateArticleData): Promise<ArticleEntity>;

  /**
   * Delete an article by slug.
   * @param slug - Article slug
   */
  delete(slug: string): Promise<void>;

  /**
   * List articles with filters and pagination.
   * @param filters - Optional filters (tag, author, favorited by user)
   * @param pagination - Limit and offset
   * @param currentUserId - Optional user ID for favorited status
   * @returns Articles (without body field per spec) and total count
   */
  list(
    filters: ArticleFilters,
    pagination: Pagination,
    currentUserId?: number
  ): Promise<ArticleListResult>;

  /**
   * Get feed of articles from followed users.
   * @param userId - Current user ID
   * @param pagination - Limit and offset
   * @returns Articles from followed users (without body) and total count
   */
  getFeed(userId: number, pagination: Pagination): Promise<ArticleListResult>;

  /**
   * Add article to user's favorites.
   * @param slug - Article slug
   * @param userId - User ID
   * @returns Updated article with incremented favoritesCount
   */
  favorite(slug: string, userId: number): Promise<ArticleEntity>;

  /**
   * Remove article from user's favorites.
   * @param slug - Article slug
   * @param userId - User ID
   * @returns Updated article with decremented favoritesCount
   */
  unfavorite(slug: string, userId: number): Promise<ArticleEntity>;
}

export interface ArticleEntity {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
  tagList: string[];
  favorited: boolean;
  favoritesCount: number;
}

export interface CreateArticleData {
  title: string;
  description: string;
  body: string;
  slug: string;
  authorId: number;
  tagList: string[];
}

export interface UpdateArticleData {
  title?: string;
  description?: string;
  body?: string;
  slug?: string;
}

export interface ArticleFilters {
  tag?: string;
  author?: string;
  favoritedBy?: string;
}

export interface Pagination {
  limit: number;
  offset: number;
}

export interface ArticleListResult {
  articles: Omit<ArticleEntity, 'body'>[];
  articlesCount: number;
}
```

```typescript
// src/repositories/IProfileRepository.ts

/**
 * Profile repository port interface.
 * Profiles are read-only views of users with following status.
 */
export interface IProfileRepository {
  /**
   * Get a user's profile by username.
   * @param username - Target user's username
   * @param currentUserId - Optional current user ID for following status
   * @returns Profile or null if user not found
   */
  getByUsername(username: string, currentUserId?: number): Promise<ProfileEntity | null>;
}

export interface ProfileEntity {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}
```

```typescript
// src/repositories/IUserRepository.ts

/**
 * User repository port interface.
 * Domain layer defines WHAT operations are needed.
 * Adapter layer (PrismaUserRepository) implements HOW.
 */
export interface IUserRepository {
  /**
   * Find user by unique email.
   * @returns User or null if not found
   */
  findByEmail(email: string): Promise<UserEntity | null>;

  /**
   * Find user by unique username.
   * @returns User or null if not found
   */
  findByUsername(username: string): Promise<UserEntity | null>;

  /**
   * Find user by ID.
   * @returns User or null if not found
   */
  findById(id: number): Promise<UserEntity | null>;

  /**
   * Create a new user.
   * @param data - User creation data (email, username, passwordHash)
   * @returns Created user
   */
  create(data: CreateUserData): Promise<UserEntity>;

  /**
   * Update an existing user.
   * @param id - User ID
   * @param data - Partial update data
   * @returns Updated user
   */
  update(id: number, data: UpdateUserData): Promise<UserEntity>;

  /**
   * Check if user follows another user.
   * @param followerId - ID of the follower
   * @param followingId - ID of the user being followed
   * @returns true if follow relationship exists
   */
  isFollowing(followerId: number, followingId: number): Promise<boolean>;

  /**
   * Create a follow relationship.
   * @param followerId - ID of the follower
   * @param followingId - ID of the user to follow
   */
  follow(followerId: number, followingId: number): Promise<void>;

  /**
   * Remove a follow relationship.
   * @param followerId - ID of the follower
   * @param followingId - ID of the user to unfollow
   */
  unfollow(followerId: number, followingId: number): Promise<void>;
}

export interface UserEntity {
  id: number;
  email: string;
  username: string;
  passwordHash: string;
  bio: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  username: string;
  passwordHash: string;
  bio?: string;
  image?: string;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  passwordHash?: string;
  bio?: string;
  image?: string;
}
```

## Fixed Source Files

```typescript
// src/app.ts
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
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
import { createUserRoutes } from './routes/user.routes';
import { createProfileRoutes } from './routes/profile.routes';
import { createArticleRoutes } from './routes/article.routes';
import { createCommentRoutes } from './routes/comment.routes';
import { createTagRoutes } from './routes/tag.routes';
import { errorHandler } from './middleware/errorHandler';

/**
 * Create and configure Express application.
 * Composition root: all dependencies wired here.
 */
export function createApp(prisma: PrismaClient): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Dependency injection: Repository → Service → Routes
  const userRepository = new PrismaUserRepository(prisma);
  const profileRepository = new PrismaProfileRepository(prisma);
  const articleRepository = new PrismaArticleRepository(prisma);
  const tagRepository = new PrismaTagRepository(prisma);
  const commentRepository = new PrismaCommentRepository(prisma);

  const authService = new AuthService(userRepository);
  const profileService = new ProfileService(profileRepository, userRepository);
  const articleService = new ArticleService(articleRepository, userRepository);
  const commentService = new CommentService(commentRepository, articleRepository);
  const tagService = new TagService(tagRepository);

  // Mount routes
  app.use('/api', createAuthRoutes(authService));
  app.use('/api', createUserRoutes(authService));
  app.use('/api', createProfileRoutes(profileService));
  app.use('/api', createArticleRoutes(articleService));
  app.use('/api', createCommentRoutes(commentService));
  app.use('/api', createTagRoutes(tagService));

  // Error handler must be last
  app.use(errorHandler);

  return app;
}
```

```typescript
// src/index.ts
import { PrismaClient } from '@prisma/client';
import { createApp } from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);

const prisma = new PrismaClient();
const app = createApp(prisma);

const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Process terminated');
    process.exit(0);
  });
});
```

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../errors/AppError';
import { verifyToken } from '../utils/jwt';

/**
 * Extract token from Authorization header.
 * RealWorld spec format: "Token jwt.token.here" (not Bearer)
 */
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Token') {
    return null;
  }

  return parts[1];
}

/**
 * Authentication middleware (required).
 * Verifies JWT token and attaches user to request.
 * @throws AuthenticationError if token missing or invalid
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);
  
  if (!token) {
    throw new AuthenticationError('No authorization token provided');
  }

  const payload = verifyToken(token);
  
  req.user = {
    id: payload.userId,
    email: '',
    username: ''
  };

  next();
}

/**
 * Optional authentication middleware.
 * Attaches user to request if token present and valid, but doesn't fail if missing.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);
  
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.userId,
      email: '',
      username: ''
    };
  } catch (error) {
    // Invalid token in optional auth context - ignore and continue
  }

  next();
}
```

```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

/**
 * Format error response per RealWorld spec: {"errors": {"body": ["message"]}}
 */
function formatErrorResponse(message: string): { errors: { body: string[] } } {
  return {
    errors: {
      body: [message]
    }
  };
}

/**
 * Centralized error handler middleware.
 * Maps AppError subclasses to HTTP responses with spec-compliant format.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    // Known application error
    console.warn({
      err,
      statusCode: err.statusCode,
      context: err.context,
      path: req.path,
      method: req.method
    });

    res.status(err.statusCode).json(formatErrorResponse(err.message));
    return;
  }

  // Unknown error - don't leak internals
  console.error({
    err,
    path: req.path,
    method: req.method
  });

  res.status(500).json(formatErrorResponse('Internal server error'));
}
```

```typescript
// src/repositories/PrismaArticleRepository.ts
import { PrismaClient } from '@prisma/client';
import {
  IArticleRepository,
  ArticleEntity,
  CreateArticleData,
  UpdateArticleData,
  ArticleFilters,
  Pagination,
  ArticleListResult
} from './IArticleRepository';

/**
 * Prisma implementation of article repository.
 */
export class PrismaArticleRepository implements IArticleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findBySlug(slug: string, currentUserId?: number): Promise<ArticleEntity | null> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            username: true,
            bio: true,
            image: true,
            followedBy: currentUserId
              ? { where: { followerId: currentUserId }, select: { followerId: true } }
              : false
          }
        },
        tags: {
          include: { tag: true }
        },
        favoritedBy: currentUserId
          ? { where: { userId: currentUserId }, select: { userId: true } }
          : { select: { userId: true } },
        _count: {
          select: { favoritedBy: true }
        }
      }
    });

    if (!article) {
      return null;
    }

    return this.mapToArticleEntity(article, currentUserId);
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await this.prisma.article.count({
      where: { slug }
    });
    return count > 0;
  }

  async create(data: CreateArticleData): Promise<ArticleEntity> {
    const article = await this.prisma.article.create({
      data: {
        title: data.title,
        description: data.description,
        body: data.body,
        slug: data.slug,
        authorId: data.authorId,
        tags: {
          create: data.tagList.map((tagName: string) => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: { name: tagName }
              }
            }
          }))
        }
      },
      include: {
        author: {
          select: {
            username: true,
            bio: true,
            image: true,
            followedBy: { where: { followerId: data.authorId }, select: { followerId: true } }
          }
        },
        tags: {
          include: { tag: true }
        },
        favoritedBy: { select: { userId: true } },
        _count: {
          select: { favoritedBy: true }
        }
      }
    });

    return this.mapToArticleEntity(article, data.authorId);
  }

  async update(slug: string, data: UpdateArticleData): Promise<ArticleEntity> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true, authorId: true }
    });

    if (!article) {
      throw new Error('Article not found');
    }

    const updated = await this.prisma.article.update({
      where: { slug },
      data: {
        title: data.title,
        description: data.description,
        body: data.body,
        slug: data.slug
      },
      include: {
        author: {
          select: {
            username: true,
            bio: true,
            image: true,
            followedBy: { where: { followerId: article.authorId }, select: { followerId: true } }
          }
        },
        tags: {
          include: { tag: true }
        },
        favoritedBy: { where: { userId: article.authorId }, select: { userId: true } },
        _count: {
          select: { favoritedBy: true }
        }
      }
    });

    return this.mapToArticleEntity(updated, article.authorId);
  }

  async delete(slug: string): Promise<void> {
    await this.prisma.article.delete({
      where: { slug }
    });
  }

  async list(
    filters: ArticleFilters,
    pagination: Pagination,
    currentUserId?: number
  ): Promise<ArticleListResult> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (filters.tag) {
      where.tags = {
        some: {
          tag: {
            name: filters.tag
          }
        }
      };
    }

    if (filters.author) {
      where.author = {
        username: filters.author
      };
    }

    if (filters.favoritedBy) {
      where.favoritedBy = {
        some: {
          user: {
            username: filters.favoritedBy
          }
        }
      };
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: {
          author: {
            select: {
              username: true,
              bio: true,
              image: true,
              followedBy: currentUserId
                ? { where: { followerId: currentUserId }, select: { followerId: true } }
                : false
            }
          },
          tags: {
            include: { tag: true }
          },
          favoritedBy: currentUserId
            ? { where: { userId: currentUserId }, select: { userId: true } }
            : { select: { userId: true } },
          _count: {
            select: { favoritedBy: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: pagination.limit,
        skip: pagination.offset
      }),
      this.prisma.article.count({ where })
    ]);

    return {
      articles: articles.map(a => {
        const entity = this.mapToArticleEntity(a, currentUserId);
        // Remove body field for list responses per spec
        const { body, ...withoutBody } = entity;
        return withoutBody;
      }),
      articlesCount: total
    };
  }

  async getFeed(userId: number, pagination: Pagination): Promise<ArticleListResult> {
    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where: {
          author: {
            followedBy: {
              some: {
                followerId: userId
              }
            }
          }
        },
        include: {
          author: {
            select: {
              username: true,
              bio: true,
              image: true,
              followedBy: { where: { followerId: userId }, select: { followerId: true } }
            }
          },
          tags: {
            include: { tag: true }
          },
          favoritedBy: { where: { userId }, select: { userId: true } },
          _count: {
            select: { favoritedBy: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: pagination.limit,
        skip: pagination.offset
      }),
      this.prisma.article.count({
        where: {
          author: {
            followedBy: {
              some: {
                followerId: userId
              }
            }
          }
        }
      })
    ]);

    return {
      articles: articles.map(a => {
        const entity = this.mapToArticleEntity(a, userId);
        // Remove body field for feed responses per spec
        const { body, ...withoutBody } = entity;
        return withoutBody;
      }),
      articlesCount: total
    };
  }

  async favorite(slug: string, userId: number): Promise<ArticleEntity> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!article) {
      throw new Error('Article not found');
    }

    await this.prisma.userFavorite.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId: article.id
        }
      },
      create: {
        userId,
        articleId: article.id
      },
      update: {}
    });

    return (await this.findBySlug(slug, userId))!;
  }

  async unfavorite(slug: string, userId: number): Promise<ArticleEntity> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!article) {
      throw new Error('Article not found');
    }

    await this.prisma.userFavorite.deleteMany({
      where: {
        userId,
        articleId: article.id
      }
    });

    return (await this.findBySlug(slug, userId))!;
  }

  /**
   * Map Prisma result to ArticleEntity.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToArticleEntity(article: any, currentUserId?: number): ArticleEntity {
    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following: currentUserId
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? (article.author.followedBy as any[]).length > 0
          : false
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tagList: article.tags.map((t: any) => t.tag.name),
      favorited: currentUserId
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? article.favoritedBy.some((f: any) => f.userId === currentUserId)
        : false,
      favoritesCount: article._count.favoritedBy
    };
  }
}
```

```typescript
// src/routes/tag.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { TagService } from '../services/tag.service';

/**
 * Tag routes factory.
 */
export function createTagRoutes(tagService: TagService): Router {
  const router = Router();

  /**
   * GET /api/tags - Get all tags
   * No auth required
   */
  router.get('/tags', async (_req: Request, res: Response, next: NextFunction) => {
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
// src/services/article.service.ts
import { IArticleRepository, ArticleFilters, Pagination } from '../repositories/IArticleRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { NotFoundError, AuthorizationError } from '../errors/AppError';
import { generateSlug, makeSlugUnique } from '../utils/slug';

// Constants per CLAUDE.md (no hardcoded values)
const DEFAULT_ARTICLES_LIMIT = 20;
const DEFAULT_ARTICLES_OFFSET = 0;
const MAX_ARTICLES_LIMIT = 100;

export interface CreateArticleDto {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
}

export interface UpdateArticleDto {
  title?: string;
  description?: string;
  body?: string;
}

export interface ArticleResponse {
  slug: string;
  title: string;
  description: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
  tagList: string[];
  favorited: boolean;
  favoritesCount: number;
}

export interface ArticleListResponse {
  slug: string;
  title: string;
  description: string;
  // Note: body field omitted per 2024-08-16 spec change
  createdAt: Date;
  updatedAt: Date;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
  tagList: string[];
  favorited: boolean;
  favoritesCount: number;
}

export interface ListArticlesResult {
  articles: ArticleListResponse[];
  articlesCount: number;
}

/**
 * Article service.
 * Handles article CRUD, favorites, and feed operations.
 */
export class ArticleService {
  constructor(
    private readonly articleRepository: IArticleRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * List articles with optional filters and pagination.
   * @param filters - Optional tag, author, favorited filters
   * @param limit - Maximum articles to return
   * @param offset - Number of articles to skip
   * @param currentUserId - Optional current user ID for favorited/following status
   * @returns Paginated list of articles (without body field)
   */
  async listArticles(
    filters: ArticleFilters,
    limit: number = DEFAULT_ARTICLES_LIMIT,
    offset: number = DEFAULT_ARTICLES_OFFSET,
    currentUserId?: number
  ): Promise<ListArticlesResult> {
    const sanitizedLimit = Math.min(limit, MAX_ARTICLES_LIMIT);
    const pagination: Pagination = { limit: sanitizedLimit, offset };

    return await this.articleRepository.list(filters, pagination, currentUserId);
  }

  /**
   * Get feed of articles from followed users.
   * @param userId - Current user ID
   * @param limit - Maximum articles to return
   * @param offset - Number of articles to skip
   * @returns Paginated list of articles (without body field)
   */
  async getFeed(
    userId: number,
    limit: number = DEFAULT_ARTICLES_LIMIT,
    offset: number = DEFAULT_ARTICLES_OFFSET
  ): Promise<ListArticlesResult> {
    const sanitizedLimit = Math.min(limit, MAX_ARTICLES_LIMIT);
    const pagination: Pagination = { limit: sanitizedLimit, offset };

    return await this.articleRepository.getFeed(userId, pagination);
  }

  /**
   * Get single article by slug.
   * @param slug - Article slug
   * @param currentUserId - Optional current user ID for favorited/following status
   * @returns Article with full details including body
   * @throws NotFoundError if article not found
   */
  async getArticle(slug: string, currentUserId?: number): Promise<ArticleResponse> {
    const article = await this.articleRepository.findBySlug(slug, currentUserId);

    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    return article;
  }

  /**
   * Create a new article.
   * @param dto - Article data
   * @param authorId - Author user ID
   * @returns Created article
   */
  async createArticle(dto: CreateArticleDto, authorId: number): Promise<ArticleResponse> {
    // Generate unique slug
    let slug = generateSlug(dto.title);
    const slugExists = await this.articleRepository.slugExists(slug);
    
    if (slugExists) {
      slug = makeSlugUnique(slug);
    }

    const article = await this.articleRepository.create({
      title: dto.title,
      description: dto.description,
      body: dto.body,
      slug,
      authorId,
      tagList: dto.tagList || []
    });

    return article;
  }

  /**
   * Update an existing article.
   * @param slug - Current article slug
   * @param dto - Update data
   * @param currentUserId - Current user ID
   * @returns Updated article
   * @throws NotFoundError if article not found
   * @throws AuthorizationError if user is not the author
   */
  async updateArticle(
    slug: string,
    dto: UpdateArticleDto,
    currentUserId: number
  ): Promise<ArticleResponse> {
    const existing = await this.articleRepository.findBySlug(slug);

    if (!existing) {
      throw new NotFoundError('Article', slug);
    }

    // Authorization check: only author can update
    if (existing.author.username !== (await this.userRepository.findById(currentUserId))?.username) {
      throw new AuthorizationError('Only the author can update this article');
    }

    // If title changed, generate new slug
    let newSlug = slug;
    if (dto.title && dto.title !== existing.title) {
      newSlug = generateSlug(dto.title);
      const slugExists = await this.articleRepository.slugExists(newSlug);
      
      if (slugExists) {
        newSlug = makeSlugUnique(newSlug);
      }
    }

    const updated = await this.articleRepository.update(slug, {
      title: dto.title,
      description: dto.description,
      body: dto.body,
      slug: newSlug !== slug ? newSlug : undefined
    });

    return updated;
  }

  /**
   * Delete an article.
   * @param slug - Article slug
   * @param currentUserId - Current user ID
   * @throws NotFoundError if article not found
   * @throws AuthorizationError if user is not the author
   */
  async deleteArticle(slug: string, currentUserId: number): Promise<void> {
    const existing = await this.articleRepository.findBySlug(slug);

    if (!existing) {
      throw new NotFoundError('Article', slug);
    }

    // Authorization check: only author can delete
    const currentUser = await this.userRepository.findById(currentUserId);
    if (existing.author.username !== currentUser?.username) {
      throw new AuthorizationError('Only the author can delete this article');
    }

    await this.articleRepository.delete(slug);
  }

  /**
   * Favorite an article.
   * @param slug - Article slug
   * @param userId - User ID
   * @returns Updated article with favorited = true
   * @throws NotFoundError if article not found
   */
  async favoriteArticle(slug: string, userId: number): Promise<ArticleResponse> {
    const exists = await this.articleRepository.findBySlug(slug);
    if (!exists) {
      throw new NotFoundError('Article', slug);
    }

    return await this.articleRepository.favorite(slug, userId);
  }

  /**
   * Unfavorite an article.
   * @param slug - Article slug
   * @param userId - User ID
   * @returns Updated article with favorited = false
   * @throws NotFoundError if article not found
   */
  async unfavoriteArticle(slug: string, userId: number): Promise<ArticleResponse> {
    const exists = await this.articleRepository.findBySlug(slug);
    if (!exists) {
      throw new NotFoundError('Article', slug);
    }

    return await this.articleRepository.unfavorite(slug, userId);
  }
}
```

```typescript
// src/services/profile.service.ts
import { IProfileRepository } from '../repositories/IProfileRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { NotFoundError, ValidationError } from '../errors/AppError';

export interface ProfileResponse {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

/**
 * Profile service.
 * Handles profile retrieval and follow/unfollow operations.
 */
export class ProfileService {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Get user profile by username.
   * @param username - Target user's username
   * @param currentUserId - Optional current user ID for follow status
   * @returns Profile with follow status
   * @throws NotFoundError if user not found
   */
  async getProfile(username: string, currentUserId?: number): Promise<ProfileResponse> {
    const profile = await this.profileRepository.getByUsername(username, currentUserId);

    if (!profile) {
      throw new NotFoundError('Profile', username);
    }

    return profile;
  }

  /**
   * Follow a user.
   * @param username - Username to follow
   * @param currentUserId - Current user ID
   * @returns Updated profile with following = true
   * @throws NotFoundError if target user not found
   * @throws ValidationError if trying to follow self
   */
  async followUser(username: string, currentUserId: number): Promise<ProfileResponse> {
    // Get target user
    const targetUser = await this.userRepository.findByUsername(username);
    if (!targetUser) {
      throw new NotFoundError('Profile', username);
    }

    // Cannot follow yourself
    if (targetUser.id === currentUserId) {
      throw new ValidationError('Cannot follow yourself');
    }

    // Check if already following
    const alreadyFollowing = await this.userRepository.isFollowing(currentUserId, targetUser.id);
    
    if (!alreadyFollowing) {
      await this.userRepository.follow(currentUserId, targetUser.id);
    }

    // Return profile with following = true (idempotent)
    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: true
    };
  }

  /**
   * Unfollow a user.
   * @param username - Username to unfollow
   * @param currentUserId - Current user ID
   * @returns Updated profile with following = false
   * @throws NotFoundError if target user not found
   */
  async unfollowUser(username: string, currentUserId: number): Promise<ProfileResponse> {
    // Get target user
    const targetUser = await this.userRepository.findByUsername(username);
    if (!targetUser) {
      throw new NotFoundError('Profile', username);
    }

    // Check if currently following
    const isFollowing = await this.userRepository.isFollowing(currentUserId, targetUser.id);
    
    if (isFollowing) {
      await this.userRepository.unfollow(currentUserId, targetUser.id);
    }

    // Return profile with following = false (idempotent)
    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: false
    };
  }
}
```

```typescript
// src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../errors/AppError';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-tests';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '30d';

export interface JwtPayload {
  userId: number;
}

/**
 * Sign a JWT token with user ID payload.
 * @param userId - User ID to encode in token
 * @returns Signed JWT token string
 */
export function signToken(userId: number): string {
  const payload: JwtPayload = { userId };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify and decode a JWT token.
 * @param token - Token string to verify
 * @returns Decoded payload
 * @throws AuthenticationError if token is invalid or expired
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token');
    }
    throw new AuthenticationError('Token verification failed');
  }
}
```

```json
// package.json
{
  "name": "conduit-api",
  "version": "1.0.0",
  "description": "RealWorld Conduit API - Treatment-v3 (Dependency Registry)",
  "main": "dist/index.js",
  "scripts": {
    "prepare": "husky install",
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "migrate": "prisma migrate deploy",
    "migrate:dev": "prisma migrate dev",
    "db:seed": "ts-node prisma/seed.ts",
    "prisma:generate": "prisma generate"
  },
  "keywords": ["realworld", "conduit", "api", "rest"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.21.0",
    "@prisma/client": "^5.20.0",
    "argon2": "^0.41.1",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.8",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.4.1"
  },
  "devDependencies": {
    "@types/node": "^22.7.5",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/cors": "^2.8.17",
    "@types/jest": "^29.5.13",
    "@types/supertest": "^6.0.2",
    "typescript": "^5.6.3",
    "@typescript-eslint/eslint-plugin": "^8.8.1",
    "@typescript-eslint/parser": "^8.8.1",
    "eslint": "^8.57.1",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.5",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "supertest": "^7.0.0",
    "prisma": "^5.20.0",
    "husky": "^9.1.6",
    "@commitlint/cli": "^19.5.0",
    "@commitlint/config-conventional": "^19.5.0",
    "@stryker-mutator/core": "^8.6.0",
    "@stryker-mutator/jest-runner": "^8.6.0",
    "@stryker-mutator/typescript-checker": "^8.6.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```