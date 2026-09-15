import express, { Application } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppConfig } from './config/env';
import { errorHandler } from './middleware/error';

import { UserRepository } from './modules/users/user.repository';
import { UserService } from './modules/users/user.service';
import { createUserRouter } from './modules/users/user.routes';

import { ProfileRepository } from './modules/profiles/profile.repository';
import { ProfileService } from './modules/profiles/profile.service';
import { createProfileRouter } from './modules/profiles/profile.routes';

import { ArticleRepository } from './modules/articles/article.repository';
import { ArticleService } from './modules/articles/article.service';
import { createArticleRouter } from './modules/articles/article.routes';

import { CommentRepository } from './modules/comments/comment.repository';
import { CommentService } from './modules/comments/comment.service';
import { createCommentRouter } from './modules/comments/comment.routes';

import { TagService } from './modules/tags/tag.service';
import { createTagRouter } from './modules/tags/tag.routes';

/**
 * Composition root: wires repositories, services and routers via dependency
 * injection and returns a configured Express application.
 * @param prisma the shared Prisma client
 * @param config the validated runtime configuration
 * @returns the configured Express {@link Application}
 */
export function createApp(prisma: PrismaClient, config: AppConfig): Application {
  const userRepository = new UserRepository(prisma);
  const profileRepository = new ProfileRepository(prisma);
  const articleRepository = new ArticleRepository(prisma);
  const commentRepository = new CommentRepository(prisma);

  const userService = new UserService(userRepository, config.jwtSecret);
  const profileService = new ProfileService(profileRepository);
  const articleService = new ArticleService(articleRepository, profileRepository);
  const commentService = new CommentService(commentRepository, profileRepository);
  const tagService = new TagService(articleRepository);

  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api', createUserRouter(userService));
  app.use('/api', createProfileRouter(profileService));
  app.use('/api', createArticleRouter(articleService));
  app.use('/api', createCommentRouter(commentService));
  app.use('/api', createTagRouter(tagService));

  app.use(errorHandler);

  return app;
}
