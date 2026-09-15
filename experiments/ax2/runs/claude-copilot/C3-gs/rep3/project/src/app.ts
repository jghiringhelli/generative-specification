import express, { Application } from 'express';
import cors from 'cors';
import 'express-async-errors';
import { Container } from './config/container';
import { userRoutes } from './routes/userRoutes';
import { profileRoutes } from './routes/profileRoutes';
import { articleRoutes } from './routes/articleRoutes';
import { tagRoutes } from './routes/tagRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

/**
 * Build the Express application from a wired container.
 * Kept free of process/server concerns so it can be tested in-process.
 */
export function createApp(container: Container): Application {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api', userRoutes(container.authController, container.config));
  app.use(
    '/api/profiles',
    profileRoutes(container.profileController, container.config),
  );
  app.use(
    '/api/articles',
    articleRoutes(
      container.articleController,
      container.commentController,
      container.config,
    ),
  );
  app.use('/api/tags', tagRoutes(container.tagController));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
