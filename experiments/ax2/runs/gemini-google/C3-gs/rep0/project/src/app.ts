// src/app.ts
import express, { Express } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { UserRepository } from './repositories/UserRepository';
import { AuthService } from './services/AuthService';
import { UserController } from './controllers/UserController';
import { createUserRouter } from './routes/userRoutes';
import { ProfileRepository } from './repositories/ProfileRepository';
import { ProfileService } from './services/ProfileService';
import { ProfileController } from './controllers/ProfileController';
import { createProfileRouter } from './routes/profileRoutes';
import { ArticleRepository } from './repositories/ArticleRepository';
import { ArticleService } from './services/ArticleService';
import { ArticleController } from './controllers/ArticleController';
import { createArticleRouter } from './routes/articleRoutes';
import { CommentRepository } from './repositories/CommentRepository';
import { CommentService } from './services/CommentService';
import { CommentController } from './controllers/CommentController';
import { createCommentRouter } from './routes/commentRoutes';
import { TagRepository } from './repositories/TagRepository';
import { TagService } from './services/TagService';
import { TagController } from './controllers/TagController';
import { createTagRouter } from './routes/tagRoutes';

export function createApp(): Express {
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
  const articleService = new ArticleService(articleRepository);
  const commentService = new CommentService(commentRepository);
  const tagService = new TagService(tagRepository);

  // Controllers
  const userController = new UserController(authService);
  const profileController = new ProfileController(profileService);
  const articleController = new ArticleController(articleService);
  const commentController = new CommentController(commentService);
  const tagController = new TagController(tagService);

  // Routes
  const apiRouter = express.Router();
  apiRouter.use(createUserRouter(userController));
  apiRouter.use(createProfileRouter(profileController));
  apiRouter.use(createArticleRouter(articleController));
  apiRouter.use(createCommentRouter(commentController));
  apiRouter.use(createTagRouter(tagController));

  app.use('/api', apiRouter);

  // Error Handler
  app.use(errorHandler);

  return app;
}
