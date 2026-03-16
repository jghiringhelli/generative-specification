
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
