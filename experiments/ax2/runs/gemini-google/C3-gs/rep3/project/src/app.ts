// src/app.ts
import express, { Express } from 'express';
import cors from 'cors';
import { prisma } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { UserRepository } from './repositories/UserRepository';
import { AuthService } from './services/AuthService';
import { AuthController } from './controllers/AuthController';
import { createUserRoutes } from './routes/userRoutes';
import { ProfileRepository } from './repositories/ProfileRepository';
import { ProfileService } from './services/ProfileService';
import { ProfileController } from './controllers/ProfileController';
import { createProfileRoutes } from './routes/profileRoutes';
import { ArticleRepository } from './repositories/ArticleRepository';
import { ArticleService } from './services/ArticleService';
import { ArticleController } from './controllers/ArticleController';
import { createArticleRoutes } from './routes/articleRoutes';
import { CommentRepository } from './repositories/CommentRepository';
import { CommentService } from './services/CommentService';
import { CommentController } from './controllers/CommentController';
import { createCommentRoutes } from './routes/commentRoutes';
import { TagRepository } from './repositories/TagRepository';
import { TagService } from './services/TagService';
import { TagController } from './controllers/TagController';
import { createTagRoutes } from './routes/tagRoutes';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Repositories
  const userRepository = new UserRepository(prisma);
  const profileRepository = new ProfileRepository(prisma);
  const articleRepository = new ArticleRepository(prisma);
  const commentRepository = new CommentRepository(prisma);
  const tagRepository = new TagRepository(prisma);

  // Services
  const authService = new AuthService(userRepository);
  const profileService = new ProfileService(profileRepository);
  const articleService = new ArticleService(articleRepository);
  const commentService = new CommentService(commentRepository, articleRepository, profileRepository);
  const tagService = new TagService(tagRepository);

  // Controllers
  const authController = new AuthController(authService);
  const profileController = new ProfileController(profileService);
  const articleController = new ArticleController(articleService);
  const commentController = new CommentController(commentService);
  const tagController = new TagController(tagService);

  // Routes
  const userRoutes = createUserRoutes(authController);
  const profileRoutes = createProfileRoutes(profileController);
  const articleRoutes = createArticleRoutes(articleController);
  const commentRoutes = createCommentRoutes(commentController);
  const tagRoutes = createTagRoutes(tagController);

  app.use('/api', userRoutes);
  app.use('/api', profileRoutes);
  app.use('/api', articleRoutes);
  app.use('/api', commentRoutes);
  app.use('/api', tagRoutes);

  // Error handling
  app.use(errorHandler);

  return app;
}

export const app = createApp();
