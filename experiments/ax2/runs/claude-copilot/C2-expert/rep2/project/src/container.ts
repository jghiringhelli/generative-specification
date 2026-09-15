import { UserRepository } from './repositories/user.repository';
import { ArticleRepository } from './repositories/article.repository';
import { CommentRepository } from './repositories/comment.repository';
import { AuthService } from './services/auth.service';
import { ProfileService } from './services/profile.service';
import { ArticleService } from './services/article.service';
import { CommentService } from './services/comment.service';
import { TagService } from './services/tag.service';

/**
 * Composition root. Instantiates repositories and services once and wires
 * their dependencies, so business logic never constructs its collaborators.
 */
export interface Container {
  authService: AuthService;
  profileService: ProfileService;
  articleService: ArticleService;
  commentService: CommentService;
  tagService: TagService;
}

/**
 * Builds the application container.
 * @returns the wired {@link Container}.
 */
export function createContainer(): Container {
  const userRepository = new UserRepository();
  const articleRepository = new ArticleRepository();
  const commentRepository = new CommentRepository();

  return {
    authService: new AuthService(userRepository),
    profileService: new ProfileService(userRepository),
    articleService: new ArticleService(articleRepository, userRepository),
    commentService: new CommentService(commentRepository, articleRepository, userRepository),
    tagService: new TagService(articleRepository)
  };
}
