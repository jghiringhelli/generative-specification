import 'express-async-errors';
import express, { Express } from 'express';
import cors from 'cors';
import { Container } from './config/container';
import { createUserRouter } from './routes/user.routes';
import { createProfileRouter } from './routes/profile.routes';
import { createArticleRouter } from './routes/article.routes';
import { createCommentRouter } from './routes/comment.routes';
import { createTagRouter } from './routes/tag.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

/**
 * Build the Express application, mounting all routers and middleware from the
 * wired container. Route handlers are thin and delegate to services.
 * @param container - The composition-root container.
 * @returns The configured Express app.
 */
export function createApp(container: Container): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const { config, userRepository } = container;

  app.use(
    '/api',
    createUserRouter(container.authService, config.jwtSecret, userRepository)
  );
  app.use(
    '/api',
    createProfileRouter(container.profileService, config.jwtSecret, userRepository)
  );
  app.use(
    '/api',
    createArticleRouter(container.articleService, config.jwtSecret, userRepository)
  );
  app.use(
    '/api',
    createCommentRouter(container.commentService, config.jwtSecret, userRepository)
  );
  app.use('/api', createTagRouter(container.tagService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
