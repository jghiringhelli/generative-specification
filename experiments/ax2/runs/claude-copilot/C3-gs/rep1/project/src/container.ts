import { UserRepository } from './repositories/UserRepository';
import { ProfileRepository } from './repositories/ProfileRepository';
import { ArticleRepository } from './repositories/ArticleRepository';
import { CommentRepository } from './repositories/CommentRepository';
import { TagRepository } from './repositories/TagRepository';
import { AuthService } from './services/AuthService';
import { ProfileService } from './services/ProfileService';
import { ArticleService } from './services/ArticleService';
import { CommentService } from './services/CommentService';
import { TagService } from './services/TagService';

/**
 * Wired application services, the single composition root for dependency injection.
 */
export interface Container {
  authService: AuthService;
  profileService: ProfileService;
  articleService: ArticleService;
  commentService: CommentService;
  tagService: TagService;
}

/**
 * Construct the application container, wiring repositories into services.
 * @returns The fully wired container.
 */
export function createContainer(): Container {
  const userRepository = new UserRepository();
  const profileRepository = new ProfileRepository();
  const articleRepository = new ArticleRepository();
  const commentRepository = new CommentRepository();
  const tagRepository = new TagRepository();

  return {
    authService: new AuthService(userRepository),
    profileService: new ProfileService(userRepository, profileRepository),
    articleService: new ArticleService(articleRepository, profileRepository),
    commentService: new CommentService(commentRepository, articleRepository, profileRepository),
    tagService: new TagService(tagRepository),
  };
}
