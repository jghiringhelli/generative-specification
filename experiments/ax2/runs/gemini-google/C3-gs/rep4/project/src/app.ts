import express, { Application } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';

import { UserRepository } from './repositories/UserRepository';
import { ProfileRepository } from './repositories/ProfileRepository';
import { ArticleRepository } from './repositories/ArticleRepository';
import { CommentRepository } from './repositories/CommentRepository';
import { TagRepository } from './repositories/TagRepository';

import { AuthService } from './services/AuthService';
import { ProfileService } from './services/ProfileService';
import { ArticleService } from './services/ArticleService';
import { CommentService } from './services/CommentService';
import { TagService } from './services/TagService';

import { AuthController } from './controllers/AuthController';
import { ProfileController } from './controllers/ProfileController';
import { ArticleController } from './controllers/ArticleController';
import { CommentController } from './controllers/CommentController';
import { TagController } from './controllers/TagController';

import { createAuthRouter } from './routes/authRoutes';
import { createProfileRouter } from './routes/profileRoutes';
import { createArticleRouter } from './routes/articleRoutes';
import { createCommentRouter } from './routes/commentRoutes';
import { createTagRouter } from './routes/tagRoutes';

export function createApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Repositories
  const userRepository = new UserRepository();
  const profileRepository = new ProfileRepository();
  const articleRepository = new ArticleRepository();
  const commentRepository = new CommentRepository();
  const tagRepository = new TagRepository();

  // Services
  const authService = new AuthService(userRepository);
  const profileService = new ProfileService(profileRepository);
  const articleService = new ArticleService(articleRepository, profileRepository);
  const commentService = new CommentService(commentRepository, articleRepository, profileRepository);
  const tagService = new TagService(tagRepository);

  // Controllers
  const authController = new AuthController(authService);
  const profileController = new ProfileController(profileService);
  const articleController = new ArticleController(articleService);
  const commentController = new CommentController(commentService);
  const tagController = new TagController(tagService);

  // Routes mounted on /api
  app.use('/api', createAuthRouter(authController));
  app.use('/api', createProfileRouter(profileController));
  app.use('/api', createArticleRouter(articleController));
  app.use('/api', createCommentRouter(commentController));
  app.use('/api', createTagRouter(tagController));

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

