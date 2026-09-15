import { UserRepository } from './repositories/user.repository';
import { FollowRepository } from './repositories/follow.repository';
import { ArticleRepository } from './repositories/article.repository';
import { FavoriteRepository } from './repositories/favorite.repository';
import { CommentRepository } from './repositories/comment.repository';
import { AuthService } from './services/auth.service';
import { ProfileService } from './services/profile.service';
import { ArticleService } from './services/article.service';
import { CommentService } from './services/comment.service';
import { TagService } from './services/tag.service';

/** Fully wired application services exposed to the route layer. */
export interface Container {
  readonly authService: AuthService;
  readonly profileService: ProfileService;
  readonly articleService: ArticleService;
  readonly commentService: CommentService;
  readonly tagService: TagService;
}

/**
 * Composition root: constructs repositories and services and wires their
 * dependencies. This is the single place where concrete classes are created.
 * @param jwtSecret The signing secret injected into auth-aware services.
 * @returns The assembled {@link Container}.
 */
export function createContainer(jwtSecret: string): Container {
  const userRepository = new UserRepository();
  const followRepository = new FollowRepository();
  const articleRepository = new ArticleRepository();
  const favoriteRepository = new FavoriteRepository();
  const commentRepository = new CommentRepository();

  const authService = new AuthService(userRepository, jwtSecret);
  const profileService = new ProfileService(userRepository, followRepository);
  const articleService = new ArticleService(
    articleRepository,
    userRepository,
    followRepository,
    favoriteRepository
  );
  const commentService = new CommentService(
    commentRepository,
    articleRepository,
    followRepository
  );
  const tagService = new TagService(articleRepository);

  return {
    authService,
    profileService,
    articleService,
    commentService,
    tagService
  };
}
