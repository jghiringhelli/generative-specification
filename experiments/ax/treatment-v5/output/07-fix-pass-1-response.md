---
nav_exclude: true
---

I'll fix all TypeScript compilation errors by prefixing unused parameters with `_`.

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
  app.get('/health', (_req, res) => {
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
// src/middleware/auth.middleware.ts

/**
 * Authentication middleware.
 * Verifies JWT token and attaches user ID to request.
 */

import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../errors/AppError';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
      };
    }
  }
}

/**
 * Extract token from Authorization header.
 * Expected format: "Token <jwt>"
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
 * Auth middleware — requires valid JWT.
 * Attaches decoded userId to req.user.
 * @throws UnauthorizedError if token is missing or invalid
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    throw new UnauthorizedError('missing authorization token');
  }

  const payload = verifyToken(token);
  req.user = { userId: payload.userId };

  next();
}

/**
 * Optional auth middleware.
 * Attaches userId to req.user if token is present and valid.
 * Does NOT throw if token is missing — allows anonymous access.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);

  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = { userId: payload.userId };
    } catch {
      // Invalid token — treat as anonymous
      req.user = undefined;
    }
  }

  next();
}
```

```typescript
// src/middleware/errorHandler.middleware.ts

/**
 * Centralized error handler middleware.
 * Converts AppError instances to RealWorld API format.
 * Catches unknown errors and returns 500.
 */

import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error
  if (error instanceof AppError) {
    logger.error(
      {
        statusCode: error.statusCode,
        message: error.message,
        context: error.context,
        path: req.path,
        method: req.method
      },
      'Application error'
    );
  } else {
    logger.error(
      {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
      },
      'Unexpected error'
    );
  }

  // Handle known application errors
  if (error instanceof AppError) {
    res.status(error.statusCode).json(error.toJSON());
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    errors: {
      body: ['internal server error']
    }
  });
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
// src/services/auth.service.ts

/**
 * Authentication service.
 * Handles user registration, login, and profile updates.
 * No direct database access — delegates to repository.
 */

import * as argon2 from 'argon2';
import type { IUserRepository } from '../repositories/IUserRepository';
import { ValidationError, NotFoundError } from '../errors/AppError';
import { signToken } from '../utils/jwt';

export interface UserResponse {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Register a new user.
   * @throws ValidationError if email or username already exists
   */
  async register(input: {
    email: string;
    username: string;
    password: string;
  }): Promise<UserResponse> {
    // Check if email already exists
    const existingEmail = await this.userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new ValidationError('email already taken');
    }

    // Check if username already exists
    const existingUsername = await this.userRepository.findByUsername(input.username);
    if (existingUsername) {
      throw new ValidationError('username already taken');
    }

    // Hash password
    const passwordHash = await argon2.hash(input.password);

    // Create user
    const user = await this.userRepository.create({
      email: input.email,
      username: input.username,
      passwordHash
    });

    // Generate token
    const token = signToken(user.id);

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }

  /**
   * Authenticate user with email and password.
   * @throws ValidationError if credentials are invalid (generic message)
   */
  async login(input: {
    email: string;
    password: string;
  }): Promise<UserResponse> {
    // Find user by email
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new ValidationError('email or password is invalid');
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.passwordHash, input.password);
    if (!isValidPassword) {
      throw new ValidationError('email or password is invalid');
    }

    // Generate token
    const token = signToken(user.id);

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }

  /**
   * Get current user by ID.
   * @throws NotFoundError if user does not exist
   */
  async getCurrentUser(userId: number): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const token = signToken(user.id);

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }

  /**
   * Update user profile.
   * @throws NotFoundError if user does not exist
   * @throws ValidationError if email/username conflicts with another user
   */
  async updateUser(
    userId: number,
    input: {
      email?: string;
      username?: string;
      password?: string;
      bio?: string;
      image?: string;
    }
  ): Promise<UserResponse> {
    // If updating email, check for conflicts
    if (input.email) {
      const existing = await this.userRepository.findByEmail(input.email);
      if (existing && existing.id !== userId) {
        throw new ValidationError('email already taken');
      }
    }

    // If updating username, check for conflicts
    if (input.username) {
      const existing = await this.userRepository.findByUsername(input.username);
      if (existing && existing.id !== userId) {
        throw new ValidationError('username already taken');
      }
    }

    // Hash password if provided
    const updateData: {
      email?: string;
      username?: string;
      passwordHash?: string;
      bio?: string;
      image?: string;
    } = {
      email: input.email,
      username: input.username,
      bio: input.bio,
      image: input.image
    };

    if (input.password) {
      updateData.passwordHash = await argon2.hash(input.password);
    }

    const user = await this.userRepository.update(userId, updateData);

    const token = signToken(user.id);

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }
}
```

```typescript
// src/services/profile.service.ts

/**
 * Profile service.
 * Handles profile retrieval and follow/unfollow operations.
 */

import type { IProfileRepository } from '../repositories/IProfileRepository';
import { NotFoundError } from '../errors/AppError';

export interface ProfileResponse {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export class ProfileService {
  constructor(private readonly profileRepository: IProfileRepository) {}

  /**
   * Get user profile by username.
   * @param username - Target user's username
   * @param currentUserId - ID of user viewing the profile (null if anonymous)
   * @throws NotFoundError if user does not exist
   */
  async getProfile(
    username: string,
    currentUserId: number | null
  ): Promise<ProfileResponse> {
    const profile = await this.profileRepository.getByUsername(username, currentUserId);

    if (!profile) {
      throw new NotFoundError('User', username);
    }

    return profile;
  }

  /**
   * Follow a user.
   * @param currentUserId - User who is following
   * @param targetUsername - Username of user to follow
   * @throws NotFoundError if target user does not exist
   * @throws ConflictError if already following or attempting to follow self
   */
  async followUser(currentUserId: number, targetUsername: string): Promise<ProfileResponse> {
    return await this.profileRepository.follow(currentUserId, targetUsername);
  }

  /**
   * Unfollow a user.
   * @param currentUserId - User who is unfollowing
   * @param targetUsername - Username of user to unfollow
   * @throws NotFoundError if target user does not exist or not currently following
   */
  async unfollowUser(currentUserId: number, targetUsername: string): Promise<ProfileResponse> {
    return await this.profileRepository.unfollow(currentUserId, targetUsername);
  }
}
```

```typescript
// src/services/article.service.test.ts

/**
 * Unit tests for ArticleService.
 */

import { ArticleService } from './article.service';
import type { IArticleRepository, IArticleWithMeta } from '../repositories/IArticleRepository';
import type { ITagRepository } from '../repositories/ITagRepository';
import { ForbiddenError } from '../errors/AppError';

const mockArticleRepository: jest.Mocked<IArticleRepository> = {
  findBySlug: jest.fn(),
  list: jest.fn(),
  getFeed: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  favorite: jest.fn(),
  unfavorite: jest.fn(),
  slugExists: jest.fn()
};

const mockTagRepository: jest.Mocked<ITagRepository> = {
  listAll: jest.fn(),
  upsertMany: jest.fn(),
  findByName: jest.fn()
};

describe('ArticleService', () => {
  let articleService: ArticleService;

  beforeEach(() => {
    jest.clearAllMocks();
    articleService = new ArticleService(mockArticleRepository, mockTagRepository);
  });

  describe('createArticle', () => {
    it('creates article with generated slug', async () => {
      const input = {
        title: 'How to Train Your Dragon',
        description: 'Ever wonder how?',
        body: 'You have to believe',
        tagList: ['dragons', 'training']
      };

      const createdArticle: IArticleWithMeta = {
        slug: 'how-to-train-your-dragon',
        title: input.title,
        description: input.description,
        body: input.body,
        tagList: input.tagList,
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'testuser',
          bio: null,
          image: null,
          following: false
        }
      };

      mockArticleRepository.slugExists.mockResolvedValue(false);
      mockTagRepository.upsertMany.mockResolvedValue([]);
      mockArticleRepository.create.mockResolvedValue(createdArticle);

      const result = await articleService.createArticle(input, 1);

      expect(mockArticleRepository.slugExists).toHaveBeenCalled();
      expect(mockTagRepository.upsertMany).toHaveBeenCalledWith(input.tagList);
      expect(mockArticleRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: input.title,
          description: input.description,
          body: input.body,
          tagList: input.tagList
        }),
        1
      );
      expect(result.slug).toBeDefined();
    });

    it('generates unique slug when base slug exists', async () => {
      const input = {
        title: 'Test Article',
        description: 'Description',
        body: 'Body',
        tagList: []
      };

      mockArticleRepository.slugExists.mockResolvedValue(true);
      mockArticleRepository.create.mockResolvedValue({
        slug: 'test-article-abc123',
        title: input.title,
        description: input.description,
        body: input.body,
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'testuser',
          bio: null,
          image: null,
          following: false
        }
      });

      await articleService.createArticle(input, 1);

      expect(mockArticleRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: expect.stringContaining('test-article-')
        }),
        1
      );
    });
  });

  describe('updateArticle', () => {
    it('updates article and returns updated data', async () => {
      const updated: IArticleWithMeta = {
        slug: 'test-article',
        title: 'Updated Title',
        description: 'Updated description',
        body: 'Updated body',
        tagList: ['tag1'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'testuser',
          bio: null,
          image: null,
          following: false
        }
      };

      mockArticleRepository.update.mockResolvedValue(updated);

      const result = await articleService.updateArticle(
        'test-article',
        { title: 'Updated Title' },
        1
      );

      expect(mockArticleRepository.update).toHaveBeenCalledWith(
        'test-article',
        { title: 'Updated Title' },
        1
      );
      expect(result.title).toBe('Updated Title');
    });

    it('throws ForbiddenError when user is not author', async () => {
      mockArticleRepository.update.mockRejectedValue(
        new ForbiddenError('Only the author can update this article')
      );

      await expect(
        articleService.updateArticle('test-article', { title: 'New' }, 2)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('deleteArticle', () => {
    it('deletes article when user is author', async () => {
      mockArticleRepository.delete.mockResolvedValue(undefined);

      await articleService.deleteArticle('test-article', 1);

      expect(mockArticleRepository.delete).toHaveBeenCalledWith('test-article', 1);
    });

    it('throws ForbiddenError when user is not author', async () => {
      mockArticleRepository.delete.mockRejectedValue(
        new ForbiddenError('Only the author can delete this article')
      );

      await expect(articleService.deleteArticle('test-article', 2)).rejects.toThrow(
        ForbiddenError
      );
    });
  });

  describe('favoriteArticle', () => {
    it('favorites article and returns updated article', async () => {
      const favorited: IArticleWithMeta = {
        slug: 'test-article',
        title: 'Test',
        description: 'Desc',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: true,
        favoritesCount: 1,
        author: {
          username: 'author',
          bio: null,
          image: null,
          following: false
        }
      };

      mockArticleRepository.favorite.mockResolvedValue(favorited);

      const result = await articleService.favoriteArticle('test-article', 1);

      expect(result.favorited).toBe(true);
      expect(result.favoritesCount).toBe(1);
    });
  });

  describe('unfavoriteArticle', () => {
    it('unfavorites article and returns updated article', async () => {
      const unfavorited: IArticleWithMeta = {
        slug: 'test-article',
        title: 'Test',
        description: 'Desc',
        body: 'Body',
        tagList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'author',
          bio: null,
          image: null,
          following: false
        }
      };

      mockArticleRepository.unfavorite.mockResolvedValue(unfavorited);

      const result = await articleService.unfavoriteArticle('test-article', 1);

      expect(result.favorited).toBe(false);
      expect(result.favoritesCount).toBe(0);
    });
  });
});
```