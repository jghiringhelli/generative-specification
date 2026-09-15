import express, { Express } from 'express';
import cors from 'cors';
import { IUserRepository } from './repositories/IUserRepository';
import { InMemoryUserRepository } from './repositories/in-memory/InMemoryUserRepository';
import { IProfileRepository } from './repositories/IProfileRepository';
import { InMemoryProfileRepository } from './repositories/in-memory/InMemoryProfileRepository';
import { IArticleRepository } from './repositories/IArticleRepository';
import { InMemoryArticleRepository } from './repositories/in-memory/InMemoryArticleRepository';
import { ICommentRepository } from './repositories/ICommentRepository';
import { InMemoryCommentRepository } from './repositories/in-memory/InMemoryCommentRepository';
import { ITagRepository } from './repositories/ITagRepository';
import { InMemoryTagRepository } from './repositories/in-memory/InMemoryTagRepository';
import { AuthService } from './services/AuthService';
import { ProfileService } from './services/ProfileService';
import { ArticleService } from './services/ArticleService';
import { CommentService } from './services/CommentService';
import { TagService } from './services/TagService';
import { AuthController } from './controllers/AuthController';
import { ProfileController } from './controllers/ProfileController';
import { ArticleController } from './controllers/ArticleController';
import { CommentController } from './controllers/CommentController';
import { TagController } from './controllers/TagController';
import { createAuthRouter } from './routes/authRoutes';
import { createProfileRouter } from './routes/profileRoutes';
import { createArticleRouter } from './routes/articleRoutes';
import { createCommentRouter } from './routes/commentRoutes';
import { createTagRouter } from './routes/tagRoutes';
import { errorHandler } from './middleware/errorHandler';

export interface AppDependencies {
  userRepository?: IUserRepository;
  profileRepository?: IProfileRepository;
  articleRepository?: IArticleRepository;
  commentRepository?: ICommentRepository;
  tagRepository?: ITagRepository;
  authService?: AuthService;
  profileService?: ProfileService;
  articleService?: ArticleService;
  commentService?: CommentService;
  tagService?: TagService;
}

/**
 * Express application factory.
 * Configures global middleware, routes, and error handling.
 */
export function createApp(deps: AppDependencies = {}): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const userRepository = deps.userRepository ?? new InMemoryUserRepository();
  const profileRepository = deps.profileRepository ?? new InMemoryProfileRepository(userRepository);
  const articleRepository = deps.articleRepository ?? new InMemoryArticleRepository(userRepository, profileRepository);
  const commentRepository = deps.commentRepository ?? new InMemoryCommentRepository(userRepository, profileRepository, articleRepository);
  const tagRepository = deps.tagRepository ?? new InMemoryTagRepository(articleRepository);

  const authService = deps.authService ?? new AuthService(userRepository);
  const profileService = deps.profileService ?? new ProfileService(profileRepository);
  const articleService = deps.articleService ?? new ArticleService(articleRepository);
  const commentService = deps.commentService ?? new CommentService(commentRepository);
  const tagService = deps.tagService ?? new TagService(tagRepository);

  const authController = new AuthController(authService);
  const profileController = new ProfileController(profileService);
  const articleController = new ArticleController(articleService);
  const commentController = new CommentController(commentService);
  const tagController = new TagController(tagService);

  const apiRouter = express.Router();
  apiRouter.use(createAuthRouter(authController));
  apiRouter.use(createProfileRouter(profileController));
  apiRouter.use(createArticleRouter(articleController));
  apiRouter.use(createCommentRouter(commentController));
  apiRouter.use(createTagRouter(tagController));

  app.use('/api', apiRouter);
  app.use(errorHandler);

  return app;
}
