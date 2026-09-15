import { PrismaClient } from '@prisma/client';
import { AppConfig } from './config';
import { PrismaUserRepository } from './repositories/PrismaUserRepository';
import { PrismaProfileRepository } from './repositories/PrismaProfileRepository';
import { PrismaArticleRepository } from './repositories/PrismaArticleRepository';
import { PrismaCommentRepository } from './repositories/PrismaCommentRepository';
import { PrismaTagRepository } from './repositories/PrismaTagRepository';
import { AuthService } from './services/AuthService';
import { ProfileService } from './services/ProfileService';
import { ArticleService } from './services/ArticleService';
import { CommentService } from './services/CommentService';
import { TagService } from './services/TagService';

/** Fully wired application services. */
export interface Container {
  config: AppConfig;
  authService: AuthService;
  profileService: ProfileService;
  articleService: ArticleService;
  commentService: CommentService;
  tagService: TagService;
}

/**
 * Composition root: instantiate repositories and services and wire their
 * dependencies. This is the only place concrete adapters are constructed.
 * @param prisma - The shared Prisma client.
 * @param config - Validated application configuration.
 * @returns The wired container of services.
 */
export function createContainer(prisma: PrismaClient, config: AppConfig): Container {
  const userRepository = new PrismaUserRepository(prisma);
  const profileRepository = new PrismaProfileRepository(prisma);
  const articleRepository = new PrismaArticleRepository(prisma);
  const commentRepository = new PrismaCommentRepository(prisma);
  const tagRepository = new PrismaTagRepository(prisma);

  const authService = new AuthService(userRepository, {
    jwtSecret: config.jwtSecret,
    jwtExpiry: config.jwtExpiry,
  });
  const profileService = new ProfileService(userRepository, profileRepository);
  const articleService = new ArticleService(articleRepository, userRepository, profileService);
  const commentService = new CommentService(
    commentRepository,
    articleRepository,
    userRepository,
    profileService,
  );
  const tagService = new TagService(tagRepository);

  return { config, authService, profileService, articleService, commentService, tagService };
}
