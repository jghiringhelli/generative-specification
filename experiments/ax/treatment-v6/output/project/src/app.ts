import express from 'express';
import { prisma } from './config/prisma.js';
import { errorHandler } from './middleware/errorHandler.js';

// Repositories
import { PrismaUserRepository } from './repositories/PrismaUserRepository.js';
import { PrismaArticleRepository } from './repositories/PrismaArticleRepository.js';
import { PrismaCommentRepository } from './repositories/PrismaCommentRepository.js';
import { PrismaProfileRepository } from './repositories/PrismaProfileRepository.js';
import { PrismaTagRepository } from './repositories/PrismaTagRepository.js';

// Services
import { AuthService } from './services/AuthService.js';
import { ArticleService } from './services/ArticleService.js';
import { CommentService } from './services/CommentService.js';
import { ProfileService } from './services/ProfileService.js';
import { TagService } from './services/TagService.js';

// Routes
import { createAuthRouter } from './routes/auth.routes.js';
import { createArticleRouter } from './routes/article.routes.js';
import { createCommentRouter } from './routes/comment.routes.js';
import { createProfileRouter } from './routes/profile.routes.js';
import { createTagRouter } from './routes/tag.routes.js';

/**
 * Composition root: wires all dependencies and returns the configured Express app.
 * No business logic lives here — only wiring.
 * §3 Composable: all services receive repository interfaces via constructor injection.
 */
export function createApp(): express.Application {
  const app = express();
  app.use(express.json());

  // Instantiate repositories (driven adapters)
  const userRepository = new PrismaUserRepository(prisma);
  const articleRepository = new PrismaArticleRepository(prisma);
  const commentRepository = new PrismaCommentRepository(prisma);
  const profileRepository = new PrismaProfileRepository(prisma);
  const tagRepository = new PrismaTagRepository(prisma);

  // Instantiate services (business logic, depends on interfaces)
  const authService = new AuthService(userRepository);
  const articleService = new ArticleService(articleRepository);
  const commentService = new CommentService(commentRepository);
  const profileService = new ProfileService(profileRepository);
  const tagService = new TagService(tagRepository);

  // Register routes under /api prefix
  app.use('/api', createAuthRouter(authService));
  app.use('/api', createProfileRouter(profileService));
  app.use('/api', createArticleRouter(articleService));
  app.use('/api', createCommentRouter(commentService));
  app.use('/api', createTagRouter(tagService));

  // Error handler must be last
  app.use(errorHandler);

  return app;
}
