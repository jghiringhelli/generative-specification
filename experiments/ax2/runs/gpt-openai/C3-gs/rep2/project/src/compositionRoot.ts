import { AuthService } from './auth/AuthService';
import { ArgonPasswordHasher } from './auth/ArgonPasswordHasher';
import { JwtTokenService } from './auth/JwtTokenService';
import { loadEnvironment } from './config/environment';
import { prisma } from './infrastructure/prisma';
import { PrismaUserRepository } from './repositories/PrismaUserRepository';
import { ProfileService } from './profiles/ProfileService';
import { PrismaProfileRepository } from './repositories/PrismaProfileRepository';
import { ArticleService } from './articles/ArticleService';
import { SlugifyGenerator } from './articles/SlugifyGenerator';
import { PrismaArticleRepository } from './repositories/PrismaArticleRepository';
import { CommentService } from './comments/CommentService';
import { PrismaCommentRepository } from './repositories/PrismaCommentRepository';
import { TagService } from './tags/TagService';
import { PrismaTagRepository } from './repositories/PrismaTagRepository';

/** Creates application dependencies from validated environment configuration. */
export function createDependencies() {
  const environment = loadEnvironment();
  const users = new PrismaUserRepository(prisma);
  const passwordHasher = new ArgonPasswordHasher();
  const tokenService = new JwtTokenService(environment.JWT_SECRET);
  const authService = new AuthService(users, passwordHasher, tokenService);
  const profileRepository = new PrismaProfileRepository(prisma);
  const profileService = new ProfileService(profileRepository);
  const articleRepository = new PrismaArticleRepository(prisma);
  const articleService = new ArticleService(
    articleRepository,
    users,
    profileRepository,
    new SlugifyGenerator(),
  );
  const commentService = new CommentService(
    new PrismaCommentRepository(prisma),
    articleRepository,
    users,
    profileRepository,
  );
  const tagService = new TagService(new PrismaTagRepository(prisma));
  return {
    environment,
    authService,
    tokenService,
    profileService,
    articleService,
    commentService,
    tagService,
  };
}
