import { PrismaClient } from '@prisma/client';
import { AppConfig } from './config';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository';
import { PrismaProfileRepository } from '../repositories/PrismaProfileRepository';
import { PrismaArticleRepository } from '../repositories/PrismaArticleRepository';
import { PrismaCommentRepository } from '../repositories/PrismaCommentRepository';
import { PrismaTagRepository } from '../repositories/PrismaTagRepository';
import { AuthService } from '../services/AuthService';
import { ProfileService } from '../services/ProfileService';
import { ArticleService } from '../services/ArticleService';
import { CommentService } from '../services/CommentService';
import { TagService } from '../services/TagService';
import { AuthController } from '../controllers/AuthController';
import { ProfileController } from '../controllers/ProfileController';
import { ArticleController } from '../controllers/ArticleController';
import { CommentController } from '../controllers/CommentController';
import { TagController } from '../controllers/TagController';

/** Fully wired application graph produced by the composition root. */
export interface Container {
  config: AppConfig;
  authController: AuthController;
  profileController: ProfileController;
  articleController: ArticleController;
  commentController: CommentController;
  tagController: TagController;
}

/**
 * Composition root: instantiate adapters, services, and controllers and wire
 * dependencies via constructor injection.
 */
export function buildContainer(
  prisma: PrismaClient,
  config: AppConfig,
): Container {
  const userRepo = new PrismaUserRepository(prisma);
  const profileRepo = new PrismaProfileRepository(prisma);
  const articleRepo = new PrismaArticleRepository(prisma);
  const commentRepo = new PrismaCommentRepository(prisma);
  const tagRepo = new PrismaTagRepository(prisma);

  const authService = new AuthService(userRepo, config);
  const profileService = new ProfileService(userRepo, profileRepo);
  const articleService = new ArticleService(articleRepo, userRepo, profileRepo);
  const commentService = new CommentService(
    commentRepo,
    articleRepo,
    userRepo,
    profileRepo,
  );
  const tagService = new TagService(tagRepo);

  return {
    config,
    authController: new AuthController(authService),
    profileController: new ProfileController(profileService),
    articleController: new ArticleController(articleService),
    commentController: new CommentController(commentService),
    tagController: new TagController(tagService),
  };
}
