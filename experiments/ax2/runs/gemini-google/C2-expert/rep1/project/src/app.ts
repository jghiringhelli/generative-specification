import express, { Express } from 'express';
import { createUsersRouter, createUserRouter } from './modules/users/user.routes';
import { createProfilesRouter } from './modules/profiles/profile.routes';
import { createArticlesRouter } from './modules/articles/article.routes';
import { createTagsRouter } from './modules/tags/tag.routes';
import { errorHandler } from './middleware/error.middleware';

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  // Mount routes
  app.use('/api/users', createUsersRouter());
  app.use('/api/user', createUserRouter());
  app.use('/api/profiles', createProfilesRouter());
  app.use('/api/articles', createArticlesRouter());
  app.use('/api/tags', createTagsRouter());

  // Global error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
