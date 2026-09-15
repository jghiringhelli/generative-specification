import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import 'express-async-errors';
import { Container, createContainer } from './container';
import { errorHandler } from './middleware/errorHandler';
import { createUserRouter } from './routes/userRoutes';
import { createProfileRouter } from './routes/profileRoutes';
import { createArticleRouter } from './routes/articleRoutes';
import { createTagRouter } from './routes/tagRoutes';

/**
 * Build the Express application with all routes and middleware wired.
 * @param container - Optional pre-wired container (defaults to a fresh one).
 * @returns The configured Express application.
 */
export function createApp(container: Container = createContainer()): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api', createUserRouter(container));
  app.use('/api/profiles', createProfileRouter(container));
  app.use('/api/articles', createArticleRouter(container));
  app.use('/api/tags', createTagRouter(container));

  app.use(errorHandler);

  return app;
}
