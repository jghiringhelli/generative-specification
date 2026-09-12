import { getPrismaClient } from './infrastructure/database/PrismaClient';
import { PrismaUserRepository } from './infrastructure/repositories/PrismaUserRepository';
import { PrismaArticleRepository } from './infrastructure/repositories/PrismaArticleRepository';
import { PrismaCommentRepository } from './infrastructure/repositories/PrismaCommentRepository';
import { PrismaTagRepository } from './infrastructure/repositories/PrismaTagRepository';
import { BcryptPasswordHasher } from './infrastructure/security/PasswordHasher';
import { JwtTokenService } from './infrastructure/security/JwtTokenService';
import { UniqueSlugGenerator } from './infrastructure/utils/SlugGenerator';
import { UserService } from './application/services/UserService';
import { ProfileService } from './application/services/ProfileService';
import { ArticleService } from './application/services/ArticleService';
import { CommentService } from './application/services/CommentService';
import { TagService } from './application/services/TagService';
import { UserController } from './presentation/controllers/UserController';
import { ProfileController } from './presentation/controllers/ProfileController';
import { ArticleController } from './presentation/controllers/ArticleController';
import { CommentController } from './presentation/controllers/CommentController';
import { TagController } from './presentation/controllers/TagController';
import { AuthMiddleware } from './presentation/middleware/AuthMiddleware';

export class DependencyContainer {
  private static instance: DependencyContainer;

  public readonly userController: UserController;
  public readonly profileController: ProfileController;
  public readonly articleController: ArticleController;
  public readonly commentController: CommentController;
  public readonly tagController: TagController;
  public readonly authMiddleware: AuthMiddleware;

  private constructor() {
    const prisma = getPrismaClient();

    const userRepository = new PrismaUserRepository(prisma);
    const articleRepository = new PrismaArticleRepository(prisma);
    const commentRepository = new PrismaCommentRepository(prisma);
    const tagRepository = new PrismaTagRepository(prisma);

    const passwordHasher = new BcryptPasswordHasher();
    const tokenService = new JwtTokenService();
    const slugGenerator = new UniqueSlugGenerator(articleRepository);

    const userService = new UserService(userRepository, passwordHasher, tokenService);
    const profileService = new ProfileService(userRepository);
    const articleService = new ArticleService(articleRepository, userRepository, slugGenerator);
    const commentService = new CommentService(commentRepository, articleRepository, userRepository);
    const tagService = new TagService(tagRepository);

    this.userController = new UserController(userService);
    this.profileController = new ProfileController(profileService);
    this.articleController = new ArticleController(articleService);
    this.commentController = new CommentController(commentService);
    this.tagController = new TagController(tagService);
    this.authMiddleware = new AuthMiddleware(tokenService);
  }

  public static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }
}
