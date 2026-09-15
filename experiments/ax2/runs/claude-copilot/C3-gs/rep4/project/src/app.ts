import 'express-async-errors';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { Container } from './container/container';
import { buildAuthRouter } from './routes/users';
import { buildProfileRouter } from './routes/profiles';
import { buildArticleRouter } from './routes/articles';
import { buildCommentRouter } from './routes/comments';
import { buildTagRouter } from './routes/tags';
import { errorHandler } from './middleware/errorHandler';
import { NotFoundError } from './errors/AppError';

/**
 * Build the Express application (the primary driving adapter) from a wired
 * container. Registers routers and the centralized error handler.
 * @param container the composition-root output.
 * @returns a configured Express {@link Application}.
 */
export function buildApp(container: Container): Application {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api', buildAuthRouter(container.authService, container.tokens));
  app.use('/api/profiles', buildProfileRouter(container.profileService, container.tokens));
  app.use('/api/articles', buildArticleRouter(container.articleService, container.tokens));
  app.use('/api/articles', buildCommentRouter(container.commentService, container.tokens));
  app.use('/api/tags', buildTagRouter(container.tagService));

  app.use((_req: Request, _res: Response) => {
    throw new NotFoundError('route not found');
  });
  app.use(errorHandler);

  return app;
}
