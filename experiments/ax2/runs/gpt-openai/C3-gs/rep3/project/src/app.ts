import 'express-async-errors';
import cors from 'cors';
import express, { Express } from 'express';
import { AuthService } from './auth/AuthService';
import { ITokenService } from './auth/ITokenService';
import { createAuthRouter } from './auth/authRoutes';
import { ArticleService } from './articles/ArticleService';
import { createArticleRouter } from './articles/articleRoutes';
import {
  createAuthMiddleware,
  createOptionalAuthMiddleware,
} from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { ProfileService } from './profiles/ProfileService';
import { createProfileRouter } from './profiles/profileRoutes';
import { CommentService } from './comments/CommentService';
import { createCommentRouter } from './comments/commentRoutes';
import { TagService } from './tags/TagService';
import { createTagRouter } from './tags/tagRoutes';
import { notFoundHandler } from './middleware/notFoundHandler';

export interface ApplicationDependencies {
  readonly authService: AuthService;
  readonly tokenService: ITokenService;
  readonly profileService?: ProfileService;
  readonly articleService?: ArticleService;
  readonly commentService?: CommentService;
  readonly tagService?: TagService;
}

/** Creates the Express application with injected services. */
export function createApp(dependencies: ApplicationDependencies): Express {
  const app = express();
  const requireAuth = createAuthMiddleware(dependencies.tokenService);
  const optionalAuth = createOptionalAuthMiddleware(dependencies.tokenService);

  app.use(cors());
  app.use(express.json());
  app.use('/api', createAuthRouter(dependencies.authService, requireAuth));
  if (dependencies.profileService) {
    app.use('/api', createProfileRouter(
      dependencies.profileService,
      requireAuth,
      optionalAuth,
    ));
  }
  if (dependencies.articleService) {
    app.use('/api', createArticleRouter(
      dependencies.articleService,
      requireAuth,
      optionalAuth,
    ));
  }
  if (dependencies.commentService) {
    app.use('/api', createCommentRouter(
      dependencies.commentService,
      requireAuth,
      optionalAuth,
    ));
  }
  if (dependencies.tagService) {
    app.use('/api', createTagRouter(dependencies.tagService));
  }
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
