import cors from 'cors';
import express, { type Express } from 'express';
import { ArticleService } from './articles/ArticleService';
import { ArgonPasswordHasher } from './auth/PasswordHasher';
import { AuthService } from './auth/AuthService';
import { JwtTokenService } from './auth/JwtTokenService';
import { CommentService } from './comments/CommentService';
import type { Environment } from './config/env';
import { prisma } from './config/prisma';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import { ProfileService } from './profiles/ProfileService';
import { PrismaArticleRepository } from './repositories/PrismaArticleRepository';
import { PrismaCommentRepository } from './repositories/PrismaCommentRepository';
import { PrismaProfileRepository } from './repositories/PrismaProfileRepository';
import { PrismaTagRepository } from './repositories/PrismaTagRepository';
import { PrismaUserRepository } from './repositories/PrismaUserRepository';
import { createAuthRouter } from './routes/auth';
import { createArticleRouter } from './routes/articles';
import { createCommentRouter } from './routes/comments';
import { createProfileRouter } from './routes/profiles';
import { createTagRouter } from './routes/tags';
import { TagService } from './tags/TagService';

/** Creates the configured Express application. */
export function createApp(environment: Environment): Express {
  const app = express();
  const users = new PrismaUserRepository(prisma);
  const articles = new PrismaArticleRepository(prisma);
  const comments = new PrismaCommentRepository(prisma);
  const profiles = new PrismaProfileRepository(prisma);
  const tags = new PrismaTagRepository(prisma);
  const passwords = new ArgonPasswordHasher();
  const tokens = new JwtTokenService(environment.JWT_SECRET);
  const auth = new AuthService(users, passwords, tokens);
  const profileService = new ProfileService(profiles);
  const articleService = new ArticleService(articles, profiles);
  const commentService = new CommentService(comments, articles, profiles);
  const tagService = new TagService(tags);

  app.use(cors());
  app.use(express.json());
  app.use('/api', createAuthRouter(auth, tokens));
  app.use('/api/articles', createArticleRouter(articleService, tokens));
  app.use('/api/articles', createCommentRouter(commentService, tokens));
  app.use('/api/profiles', createProfileRouter(profileService, tokens));
  app.use('/api/tags', createTagRouter(tagService));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
