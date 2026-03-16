import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { PrismaClient } from '@prisma/client';
import { createAuthRouter } from './routes/auth.routes';
import { createProfileRouter } from './routes/profile.routes';
import { createArticleRouter } from './routes/article.routes';
import { createCommentRouter } from './routes/comment.routes';
import { createTagRouter } from './routes/tag.routes';
import { AuthService } from './services/auth.service';
import { ProfileService } from './services/profile.service';
import { ArticleService } from './services/article.service';
import { CommentService } from './services/comment.service';
import { TagService } from './services/tag.service';
import { UserRepository } from './repositories/user.repository';
import { ProfileRepository } from './repositories/profile.repository';
import { ArticleRepository } from './repositories/article.repository';
import { CommentRepository } from './repositories/comment.repository';
import { TagRepository } from './repositories/tag.repository';
import { errorHandler } from './middleware/error.middleware';
import { env } from './config/env';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } from './config/constants';

export function createApp(prisma: PrismaClient): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());
  
  // Rate limiting
  app.use(
    rateLimit({
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Logging
  if (env.NODE_ENV !== 'test') {
    app.use(pinoHttp({ level: env.LOG_LEVEL }));
  }

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Dependency injection - compose services
  const userRepository = new UserRepository(prisma);
  const profileRepository = new ProfileRepository(prisma);
  const articleRepository = new ArticleRepository(prisma);
  const commentRepository = new CommentRepository(prisma);
  const tagRepository = new TagRepository(prisma);
  const authService = new AuthService(userRepository);
  const profileService = new ProfileService(profileRepository);
  const articleService = new ArticleService(articleRepository);
  const commentService = new CommentService(commentRepository);
  const tagService = new TagService(tagRepository);

  // Routes
  app.use('/api', createAuthRouter(authService));
  app.use('/api', createProfileRouter(profileService));
  app.use('/api', createArticleRouter(articleService));
  app.use('/api', createCommentRouter(commentService));
  app.use('/api', createTagRouter(tagService));

  // Error handling - must be last
  app.use(errorHandler);

  return app;
}
