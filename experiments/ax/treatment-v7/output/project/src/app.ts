import express from 'express';
import { createUserRouter } from './routes/users';
import { createProfileRouter } from './routes/profiles';
import { createArticleRouter } from './routes/articles';
import { createCommentRouter } from './routes/comments';
import { createTagRouter } from './routes/tags';
import { errorHandler } from './middleware/errorHandler';
import type { UserService } from './services/UserService';
import type { ProfileService } from './services/ProfileService';
import type { ArticleService } from './services/ArticleService';
import type { CommentService } from './services/CommentService';
import type { TagService } from './services/TagService';

/** Service dependencies wired at the composition root and injected into the application. */
export interface AppDependencies {
  userService: UserService;
  profileService: ProfileService;
  articleService: ArticleService;
  commentService: CommentService;
  tagService: TagService;
}

/**
 * Factory that constructs and configures the Express application.
 *
 * Using a factory (rather than a module-level singleton) enables:
 *   - Dependency injection in tests: pass test-double services
 *   - Clean isolation: no shared state between test runs
 *   - Multiple application instances in integration test suites
 *
 * @param deps - Service dependencies to wire into route handlers
 * @returns Configured Express application, ready to listen or pass to supertest
 */
export function createApp(deps: AppDependencies): express.Application {
  const app = express();

  app.use(express.json());

  // §1 Bounded: routes call services only; services call repositories only
  app.use('/api', createUserRouter(deps.userService));
  app.use('/api', createProfileRouter(deps.profileService));
  app.use('/api', createArticleRouter(deps.articleService));
  app.use('/api', createCommentRouter(deps.commentService));
  app.use('/api', createTagRouter(deps.tagService));

  // Error handler must be last — Express detects the 4-argument signature
  app.use(errorHandler);

  return app;
}
