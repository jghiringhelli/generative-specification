import express, { Express } from 'express';
import cors from 'cors';
import 'express-async-errors';
import { Container } from './container';
import { createUserRouter } from './routes/users';
import { createProfileRouter } from './routes/profiles';
import { createArticleRouter } from './routes/articles';
import { createTagRouter } from './routes/tags';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

/**
 * Assemble the Express application from wired services. The API layer stays
 * thin: routers validate input and delegate to services; errors bubble to the
 * central error handler.
 * @param container - The wired service container.
 * @returns The configured Express app.
 */
export function createApp(container: Container): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const { jwtSecret } = container.config;

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api', createUserRouter(container.authService, jwtSecret));
  app.use('/api/profiles', createProfileRouter(container.profileService, jwtSecret));
  app.use(
    '/api/articles',
    createArticleRouter(container.articleService, container.commentService, jwtSecret),
  );
  app.use('/api/tags', createTagRouter(container.tagService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
