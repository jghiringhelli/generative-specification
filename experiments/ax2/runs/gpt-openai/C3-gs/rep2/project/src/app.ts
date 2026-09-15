import cors from 'cors';
import express, { Express } from 'express';
import { AuthService } from './auth/AuthService';
import { TokenService } from './auth/ports';
import { createAuthRouter } from './auth/routes';
import { errorHandler } from './middleware/errors';
import { ProfileService } from './profiles/ProfileService';
import { createProfileRouter } from './profiles/routes';
import { ArticleService } from './articles/ArticleService';
import { createArticleRouter } from './articles/routes';
import { CommentService } from './comments/CommentService';
import { createCommentRouter } from './comments/routes';
import { TagService } from './tags/TagService';
import { createTagRouter } from './tags/routes';

export interface ApplicationDependencies {
  readonly authService: AuthService;
  readonly tokenService: TokenService;
  readonly profileService: ProfileService;
  readonly articleService?: ArticleService;
  readonly commentService?: CommentService;
  readonly tagService?: TagService;
}

/** Creates the Express application with injected services. */
export function createApp(dependencies: ApplicationDependencies): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', createAuthRouter(dependencies.authService, dependencies.tokenService));
  app.use(
    '/api/profiles',
    createProfileRouter(dependencies.profileService, dependencies.tokenService),
  );
  if (dependencies.articleService) {
    app.use(
      '/api/articles',
      createArticleRouter(dependencies.articleService, dependencies.tokenService),
    );
  }
  if (dependencies.commentService) {
    app.use(
      '/api/articles',
      createCommentRouter(dependencies.commentService, dependencies.tokenService),
    );
  }
  if (dependencies.tagService) {
    app.use('/api/tags', createTagRouter(dependencies.tagService));
  }
  app.use(errorHandler);
  return app;
}
