import express, { type Express } from 'express';
import { createContainer } from './container';
import { createUserRouter } from './routes/user.routes';
import { createProfileRouter } from './routes/profile.routes';
import { createArticleRouter } from './routes/article.routes';
import { createCommentRouter } from './routes/comment.routes';
import { createTagRouter } from './routes/tag.routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

/**
 * Builds the fully wired Express application.
 * @param jwtSecret The signing secret injected into services and middleware.
 * @returns The configured {@link Express} application.
 */
export function createApp(jwtSecret: string): Express {
  const container = createContainer(jwtSecret);
  const app = express();
  app.use(express.json());

  app.use('/api', createUserRouter(container.authService, jwtSecret));
  app.use(
    '/api/profiles',
    createProfileRouter(container.profileService, jwtSecret)
  );
  app.use(
    '/api/articles',
    createArticleRouter(container.articleService, jwtSecret)
  );
  app.use(
    '/api/articles',
    createCommentRouter(container.commentService, jwtSecret)
  );
  app.use('/api/tags', createTagRouter(container.tagService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
