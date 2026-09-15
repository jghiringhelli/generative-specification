import express, { Express } from 'express';
import { authRouter } from './routes/auth-routes';
import { profileRouter } from './routes/profile-routes';
import { articleRouter } from './routes/article-routes';
import { commentRouter } from './routes/comment-routes';
import { tagRouter } from './routes/tag-routes';
import { errorHandler } from './middleware/error-handler';

/**
 * Creates and configures the Express application instance.
 *
 * @returns {Express} Configured Express application
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());

  // Mount API routers
  app.use('/api', authRouter);
  app.use('/api', profileRouter);
  app.use('/api', articleRouter);
  app.use('/api', commentRouter);
  app.use('/api', tagRouter);

  // Global error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
