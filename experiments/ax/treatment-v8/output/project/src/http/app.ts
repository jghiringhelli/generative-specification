/**
 * Express application factory (composition seam for HTTP).
 *
 * Pure wiring: it takes already-constructed services and assembles the
 * middleware pipeline. It opens no connections and reads no environment, so
 * tests can build an app over an in-memory repository and exercise the full
 * request/response cycle with Supertest.
 */
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createArticleRouter, type ArticleRouterDependencies } from './articleRoutes.js';
import { createCommentRouter, type CommentRouterDependencies } from './commentRoutes.js';
import { createErrorHandler } from './middleware/errorHandler.js';
import { createProfileRouter, type ProfileRouterDependencies } from './profileRoutes.js';
import { createTagRouter, type TagRouterDependencies } from './tagRoutes.js';
import { createUserRouter, type UserRouterDependencies } from './userRoutes.js';

/** Everything the HTTP app needs, injected at the composition root. */
export type AppDependencies = UserRouterDependencies &
  ProfileRouterDependencies &
  ArticleRouterDependencies &
  CommentRouterDependencies &
  TagRouterDependencies;

/**
 * Assemble the Express application.
 *
 * @param deps - the wired services.
 * @returns a ready-to-listen Express app (the caller owns `listen`).
 */
export function createApp(deps: AppDependencies): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api', createUserRouter(deps));
  app.use('/api', createProfileRouter(deps));
  app.use('/api', createArticleRouter(deps));
  app.use('/api', createCommentRouter(deps));
  app.use('/api', createTagRouter(deps));

  app.use(createErrorHandler());

  return app;
}
