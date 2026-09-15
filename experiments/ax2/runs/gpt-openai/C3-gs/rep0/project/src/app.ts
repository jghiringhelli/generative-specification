import cors from 'cors';
import express, { Express } from 'express';
import { ArticleService } from './articles/ArticleService';
import { createArticleRouter } from './articles/articleRoutes';
import { AuthService } from './auth/AuthService';
import { createAuthRouter } from './auth/authRoutes';
import { CommentService } from './comments/CommentService';
import { createCommentRouter } from './comments/commentRoutes';
import { AppConfig } from './config';
import { errorHandler } from './http/errorHandler';
import { prisma } from './infrastructure/prisma';
import { ProfileService } from './profiles/ProfileService';
import { createProfileRouter } from './profiles/profileRoutes';
import { PrismaArticleRepository } from './repositories/PrismaArticleRepository';
import { PrismaCommentRepository } from './repositories/PrismaCommentRepository';
import { PrismaProfileRepository } from './repositories/PrismaProfileRepository';
import { PrismaTagRepository } from './repositories/PrismaTagRepository';
import { PrismaUserRepository } from './repositories/PrismaUserRepository';
import { TagService } from './tags/TagService';
import { createTagRouter } from './tags/tagRoutes';

export function createApp(config: AppConfig): Express {
  const users = new PrismaUserRepository(prisma);
  const profiles = new PrismaProfileRepository(prisma);
  const articles = new PrismaArticleRepository(prisma);
  const comments = new PrismaCommentRepository(prisma);
  const authService = new AuthService(users, config.jwtSecret);
  const profileService = new ProfileService(profiles);
  const articleService = new ArticleService(articles, users, profiles);
  const commentService = new CommentService(comments, articles, users, profiles);
  const tagService = new TagService(new PrismaTagRepository(prisma));

  return express()
    .disable('x-powered-by')
    .use(cors())
    .use(express.json())
    .get('/health', (_request, response) => response.json({ status: 'ok' }))
    .use('/api', createAuthRouter(authService))
    .use('/api/profiles', createProfileRouter(profileService, authService))
    .use('/api/articles', createCommentRouter(commentService, authService))
    .use('/api/articles', createArticleRouter(articleService, authService))
    .use('/api/tags', createTagRouter(tagService))
    .use(errorHandler);
}
