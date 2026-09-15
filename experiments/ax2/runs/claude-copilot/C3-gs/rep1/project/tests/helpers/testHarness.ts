import { Application } from 'express';
import { createApp } from '../../src/app';
import { Container } from '../../src/container';
import { AuthService } from '../../src/services/AuthService';
import { ProfileService } from '../../src/services/ProfileService';
import { ArticleService } from '../../src/services/ArticleService';
import { CommentService } from '../../src/services/CommentService';
import { TagService } from '../../src/services/TagService';
import {
  InMemoryProfileRepository,
  InMemoryStore,
  InMemoryTagRepository,
  InMemoryUserRepository,
} from './userFakes';
import {
  InMemoryArticleRepository,
  InMemoryCommentRepository,
} from './articleFakes';

/**
 * A test harness bundling the in-memory store, wired container, and app.
 */
export interface TestHarness {
  app: Application;
  container: Container;
  store: InMemoryStore;
}

/**
 * Build an Express app backed entirely by in-memory repositories.
 * @returns The test harness.
 */
export function buildTestHarness(): TestHarness {
  const store = new InMemoryStore();
  const userRepository = new InMemoryUserRepository(store);
  const profileRepository = new InMemoryProfileRepository(store);
  const articleRepository = new InMemoryArticleRepository(store);
  const commentRepository = new InMemoryCommentRepository(store);
  const tagRepository = new InMemoryTagRepository(store);

  const container: Container = {
    authService: new AuthService(userRepository),
    profileService: new ProfileService(userRepository, profileRepository),
    articleService: new ArticleService(articleRepository, profileRepository),
    commentService: new CommentService(commentRepository, articleRepository, profileRepository),
    tagService: new TagService(tagRepository),
  };

  return { app: createApp(container), container, store };
}
