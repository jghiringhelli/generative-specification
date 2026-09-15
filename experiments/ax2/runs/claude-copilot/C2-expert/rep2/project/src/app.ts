import express, { Express } from 'express';
import { Container, createContainer } from './container';
import { createUserRouter } from './routes/user.routes';
import { createProfileRouter } from './routes/profile.routes';
import { createArticleRouter } from './routes/article.routes';
import { createCommentRouter } from './routes/comment.routes';
import { createTagRouter } from './routes/tag.routes';
import { errorHandler, notFoundHandler } from './middleware/error';

/**
 * Builds the Express application and mounts all API routers under `/api`.
 * @param container optional pre-wired container (used by tests).
 * @returns the configured Express app.
 */
export function createApp(container: Container = createContainer()): Express {
  const app = express();
  app.use(express.json());

  const api = express.Router();
  api.use(createUserRouter(container.authService));
  api.use(createProfileRouter(container.profileService));
  api.use(createArticleRouter(container.articleService));
  api.use(createCommentRouter(container.commentService));
  api.use(createTagRouter(container.tagService));

  app.use('/api', api);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
