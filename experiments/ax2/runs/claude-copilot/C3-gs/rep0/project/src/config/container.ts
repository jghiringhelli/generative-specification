import { PrismaClient } from '@prisma/client';
import { AppConfig } from './env';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository';
import { PrismaProfileRepository } from '../repositories/PrismaProfileRepository';
import { PrismaArticleRepository } from '../repositories/PrismaArticleRepository';
import { PrismaCommentRepository } from '../repositories/PrismaCommentRepository';
import { PrismaTagRepository } from '../repositories/PrismaTagRepository';
import { Argon2PasswordHasher } from '../utils/PasswordHasher';
import { AuthService } from '../services/AuthService';
import { ProfileService } from '../services/ProfileService';
import { ArticleService } from '../services/ArticleService';
import { CommentService } from '../services/CommentService';
import { TagService } from '../services/TagService';
import { IUserRepository } from '../repositories/IUserRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { IArticleRepository } from '../repositories/IArticleRepository';
import { ICommentRepository } from '../repositories/ICommentRepository';
import { ITagRepository } from '../repositories/ITagRepository';

/**
 * The wired application dependencies (composition root output). Adapters and
 * services are constructed here and injected into the driving adapters.
 */
export interface Container {
  config: AppConfig;
  userRepository: IUserRepository;
  profileRepository: IProfileRepository;
  articleRepository: IArticleRepository;
  commentRepository: ICommentRepository;
  tagRepository: ITagRepository;
  authService: AuthService;
  profileService: ProfileService;
  articleService: ArticleService;
  commentService: CommentService;
  tagService: TagService;
}

/**
 * Build the composition root: construct adapters and services from config.
 * @param prisma - Shared Prisma client.
 * @param config - Validated application configuration.
 * @returns The wired container.
 */
export function buildContainer(prisma: PrismaClient, config: AppConfig): Container {
  const userRepository = new PrismaUserRepository(prisma);
  const profileRepository = new PrismaProfileRepository(prisma);
  const articleRepository = new PrismaArticleRepository(prisma);
  const commentRepository = new PrismaCommentRepository(prisma);
  const tagRepository = new PrismaTagRepository(prisma);
  const passwordHasher = new Argon2PasswordHasher();

  const authService = new AuthService(userRepository, passwordHasher, config.jwtSecret);
  const profileService = new ProfileService(userRepository, profileRepository);
  const articleService = new ArticleService(
    articleRepository,
    userRepository,
    profileRepository
  );
  const commentService = new CommentService(
    commentRepository,
    articleRepository,
    userRepository,
    profileRepository
  );
  const tagService = new TagService(tagRepository);

  return {
    config,
    userRepository,
    profileRepository,
    articleRepository,
    commentRepository,
    tagRepository,
    authService,
    profileService,
    articleService,
    commentService,
    tagService
  };
}
