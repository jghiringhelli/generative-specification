import cors from 'cors';
import express, { Application } from 'express';
import { errorHandler } from './middleware/error.middleware';
import { createArticleRouter } from './routes/article.routes';
import { createCommentRouter } from './routes/comment.routes';
import { createProfileRouter } from './routes/profile.routes';
import { createTagRouter } from './routes/tag.routes';
import { createUserRouter } from './routes/user.routes';

/**
 * Creates and configures the Express application.
 *
 * @returns {Application} Configured Express application
 */
export function createApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Mount API routers
  const apiRouter = express.Router();
  apiRouter.use(createUserRouter());
  apiRouter.use(createProfileRouter());
  apiRouter.use(createArticleRouter());
  apiRouter.use(createCommentRouter());
  apiRouter.use(createTagRouter());
  app.use('/api', apiRouter);

  // Error handling middleware
  app.use(errorHandler);

  return app;
}
