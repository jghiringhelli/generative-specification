import { PrismaClient } from '@prisma/client';
import { AppConfig } from '../config/env';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository';
import { PrismaProfileRepository } from '../repositories/PrismaProfileRepository';
import { PrismaArticleRepository } from '../repositories/PrismaArticleRepository';
import { PrismaCommentRepository } from '../repositories/PrismaCommentRepository';
import { PrismaTagRepository } from '../repositories/PrismaTagRepository';
import { Argon2PasswordHasher } from '../services/adapters/Argon2PasswordHasher';
import { JwtTokenService } from '../services/adapters/JwtTokenService';
import { ITokenService } from '../services/ports/ITokenService';
import { AuthService } from '../services/AuthService';
import { ProfileService } from '../services/ProfileService';
import { ArticleService } from '../services/ArticleService';
import { CommentService } from '../services/CommentService';
import { TagService } from '../services/TagService';

/**
 * The wired object graph: services and the token service the API layer needs.
 */
export interface Container {
  tokens: ITokenService;
  authService: AuthService;
  profileService: ProfileService;
  articleService: ArticleService;
  commentService: CommentService;
  tagService: TagService;
}

/**
 * Composition root. Instantiate concrete adapters and inject them into services.
 * This is the only place where concrete classes are constructed.
 * @param prisma the shared Prisma client.
 * @param config validated application configuration.
 * @returns the fully wired {@link Container}.
 */
export function buildContainer(prisma: PrismaClient, config: AppConfig): Container {
  const userRepository = new PrismaUserRepository(prisma);
  const profileRepository = new PrismaProfileRepository(prisma);
  const articleRepository = new PrismaArticleRepository(prisma);
  const commentRepository = new PrismaCommentRepository(prisma);
  const tagRepository = new PrismaTagRepository(prisma);

  const passwordHasher = new Argon2PasswordHasher();
  const tokens = new JwtTokenService(config.jwtSecret, config.jwtExpiry);

  return {
    tokens,
    authService: new AuthService(userRepository, passwordHasher, tokens),
    profileService: new ProfileService(profileRepository),
    articleService: new ArticleService(articleRepository, profileRepository),
    commentService: new CommentService(commentRepository, articleRepository, profileRepository),
    tagService: new TagService(tagRepository),
  };
}
