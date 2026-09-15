import express, { Express } from 'express';
import { usersRouter, userRouter } from './features/users/user.routes';
import { profilesRouter } from './features/profiles/profile.routes';
import { articlesRouter } from './features/articles/article.routes';
import { commentsRouter } from './features/comments/comment.routes';
import { tagsRouter } from './features/tags/tag.routes';
import { errorHandler } from './middleware/errorHandler';

/**
 * Builds and configures the Express application with all API routes and the
 * central error handler mounted under the `/api` prefix.
 * @returns the configured Express app
 */
export function createApp(): Express {
  const app = express();
  app.use(express.json());

  const api = express.Router();
  api.use(usersRouter);
  api.use(userRouter);
  api.use(profilesRouter);
  api.use(articlesRouter);
  api.use(commentsRouter);
  api.use(tagsRouter);

  app.use('/api', api);
  app.use(errorHandler);

  return app;
}
