import express, { Express } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error.middleware';
import { IUserRepository } from './repositories/IUserRepository';
import { UserRepository } from './repositories/UserRepository';
import { AuthService } from './services/AuthService';
import { UserController } from './controllers/UserController';
import { createUserRouter } from './routes/user.routes';
import { IProfileRepository } from './repositories/IProfileRepository';
import { ProfileRepository } from './repositories/ProfileRepository';
import { ProfileService } from './services/ProfileService';
import { ProfileController } from './controllers/ProfileController';
import { createProfileRouter } from './routes/profile.routes';
import { IArticleRepository } from './repositories/IArticleRepository';
import { ArticleRepository } from './repositories/ArticleRepository';
import { ArticleService } from './services/ArticleService';
import { ArticleController } from './controllers/ArticleController';
import { createArticleRouter } from './routes/article.routes';
import { ICommentRepository } from './repositories/ICommentRepository';
import { CommentRepository } from './repositories/CommentRepository';
import { CommentService } from './services/CommentService';
import { CommentController } from './controllers/CommentController';
import { createCommentRouter } from './routes/comment.routes';
import { ITagRepository } from './repositories/ITagRepository';
import { TagRepository } from './repositories/TagRepository';
import { TagService } from './services/TagService';
import { TagController } from './controllers/TagController';
import { createTagRouter } from './routes/tag.routes';

export interface AppDependencies {
  userRepository?: IUserRepository;
  profileRepository?: IProfileRepository;
  articleRepository?: IArticleRepository;
  commentRepository?: ICommentRepository;
  tagRepository?: ITagRepository;
}

export function createApp(deps: AppDependencies = {}): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Composition root - Auth/User dependencies
  const userRepository = deps.userRepository ?? new UserRepository();
  const authService = new AuthService(userRepository);
  const userController = new UserController(authService);

  // Composition root - Profile dependencies
  const profileRepository = deps.profileRepository ?? new ProfileRepository();
  const profileService = new ProfileService(profileRepository);
  const profileController = new ProfileController(profileService);

  // Composition root - Article dependencies
  const articleRepository = deps.articleRepository ?? new ArticleRepository();
  const articleService = new ArticleService(
    articleRepository,
    userRepository,
    profileRepository
  );
  const articleController = new ArticleController(articleService);

  // Composition root - Comment dependencies
  const commentRepository = deps.commentRepository ?? new CommentRepository();
  const commentService = new CommentService(
    commentRepository,
    articleRepository,
    userRepository,
    profileRepository
  );
  const commentController = new CommentController(commentService);

  // Composition root - Tag dependencies
  const tagRepository = deps.tagRepository ?? new TagRepository();
  const tagService = new TagService(tagRepository);
  const tagController = new TagController(tagService);

  // Mount routes
  app.use('/api', createUserRouter(userController));
  app.use('/api', createProfileRouter(profileController));
  app.use('/api', createArticleRouter(articleController));
  app.use('/api', createCommentRouter(commentController));
  app.use('/api', createTagRouter(tagController));

  // Global error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
