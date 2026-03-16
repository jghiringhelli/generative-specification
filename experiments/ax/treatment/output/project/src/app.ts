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
