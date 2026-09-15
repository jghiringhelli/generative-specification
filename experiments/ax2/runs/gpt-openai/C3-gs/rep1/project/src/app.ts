import cors from 'cors';
import express, { type Express } from 'express';
import type { ITokenService } from './auth/ITokenService';
import type { ArticleController } from './controllers/ArticleController';
import type { AuthController } from './controllers/AuthController';
import type { CommentController } from './controllers/CommentController';
import type { ProfileController } from './controllers/ProfileController';
import type { TagController } from './controllers/TagController';
import { errorHandler } from './middleware/errorHandler';
import { createArticleRouter } from './routes/articleRoutes';
import { createAuthRouter } from './routes/authRoutes';
import { createCommentRouter } from './routes/commentRoutes';
import { createProfileRouter } from './routes/profileRoutes';
import { createTagRouter } from './routes/tagRoutes';

export interface AppDependencies {
  readonly authController: AuthController;
  readonly tokenService: ITokenService;
  readonly profileController?: ProfileController;
  readonly articleController?: ArticleController;
  readonly commentController?: CommentController;
  readonly tagController?: TagController;
}

export function createApp(dependencies: AppDependencies): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', createAuthRouter(dependencies.authController, dependencies.tokenService));
  if (dependencies.profileController) app.use('/api', createProfileRouter(dependencies.profileController, dependencies.tokenService));
  if (dependencies.commentController) app.use('/api', createCommentRouter(dependencies.commentController, dependencies.tokenService));
  if (dependencies.articleController) app.use('/api', createArticleRouter(dependencies.articleController, dependencies.tokenService));
  if (dependencies.tagController) app.use('/api', createTagRouter(dependencies.tagController));
  app.use(errorHandler);
  return app;
}
