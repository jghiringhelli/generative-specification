import { Application } from 'express';
import { AppConfig } from '../../src/config/config';
import { createApp } from '../../src/app';
import { Container } from '../../src/config/container';
import { AuthService } from '../../src/services/AuthService';
import { ProfileService } from '../../src/services/ProfileService';
import { ArticleService } from '../../src/services/ArticleService';
import { CommentService } from '../../src/services/CommentService';
import { TagService } from '../../src/services/TagService';
import { AuthController } from '../../src/controllers/AuthController';
import { ProfileController } from '../../src/controllers/ProfileController';
import { ArticleController } from '../../src/controllers/ArticleController';
import { CommentController } from '../../src/controllers/CommentController';
import { TagController } from '../../src/controllers/TagController';
import {
  InMemoryArticleRepository,
  InMemoryCommentRepository,
  InMemoryProfileRepository,
  InMemoryTagRepository,
  InMemoryUserRepository,
} from '../fixtures/inMemoryRepositories';

/** Deterministic config used across the integration test suite. */
export const testConfig: AppConfig = {
  port: 0,
  jwtSecret: 'test-secret',
  jwtExpiry: '1h',
  nodeEnv: 'test',
};

/** Repositories exposed to tests for arranging state and assertions. */
export interface TestHarness {
  app: Application;
  users: InMemoryUserRepository;
  follows: InMemoryProfileRepository;
  articles: InMemoryArticleRepository;
  comments: InMemoryCommentRepository;
}

/** Build an Express app wired entirely with in-memory fakes. */
export function buildTestHarness(): TestHarness {
  const users = new InMemoryUserRepository();
  const follows = new InMemoryProfileRepository();
  const articles = new InMemoryArticleRepository(follows);
  const comments = new InMemoryCommentRepository();
  const tags = new InMemoryTagRepository(() => articles.allTags());

  const usernameCache = new Map<number, string>();
  articles.setUsernameResolver((authorId) => usernameCache.get(authorId));
  const usernameToId = new Map<string, number>();
  articles.setFavoritedUserResolver((username) => usernameToId.get(username));

  const authService = new AuthService(users, testConfig);
  const profileService = new ProfileService(users, follows);
  const articleService = new ArticleService(articles, users, follows);
  const commentService = new CommentService(comments, articles, users, follows);
  const tagService = new TagService(tags);

  const container: Container = {
    config: testConfig,
    authController: new AuthController(authService),
    profileController: new ProfileController(profileService),
    articleController: new ArticleController(articleService),
    commentController: new CommentController(commentService),
    tagController: new TagController(tagService),
  };

  const app = createApp(container);

  // Keep the resolver caches in sync as users register.
  const originalCreate = users.create.bind(users);
  users.create = async (input) => {
    const created = await originalCreate(input);
    usernameCache.set(created.id, created.username);
    usernameToId.set(created.username, created.id);
    return created;
  };

  return { app, users, follows, articles, comments };
}
