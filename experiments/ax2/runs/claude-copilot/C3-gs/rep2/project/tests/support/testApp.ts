import { Express } from 'express';
import { createApp } from '../../src/app';
import { Container } from '../../src/container';
import { AuthService } from '../../src/services/AuthService';
import { ProfileService } from '../../src/services/ProfileService';
import { ArticleService } from '../../src/services/ArticleService';
import { CommentService } from '../../src/services/CommentService';
import { TagService } from '../../src/services/TagService';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';
import { InMemoryProfileRepository } from '../fakes/InMemoryProfileRepository';
import { InMemoryArticleRepository } from '../fakes/InMemoryArticleRepository';
import { InMemoryCommentRepository } from '../fakes/InMemoryCommentRepository';
import { InMemoryTagRepository } from '../fakes/InMemoryTagRepository';

/** JWT secret used across integration tests. */
export const TEST_JWT_SECRET = 'test-secret';

/** A test harness exposing the app plus the fakes for assertions. */
export interface TestHarness {
  app: Express;
  users: InMemoryUserRepository;
  profiles: InMemoryProfileRepository;
  articles: InMemoryArticleRepository;
  comments: InMemoryCommentRepository;
  tags: InMemoryTagRepository;
}

/**
 * Build an Express app wired entirely to in-memory fakes for integration tests.
 * @returns The test harness.
 */
export function buildTestHarness(): TestHarness {
  const users = new InMemoryUserRepository();
  const profiles = new InMemoryProfileRepository();
  const articles = new InMemoryArticleRepository(users, profiles);
  const comments = new InMemoryCommentRepository();
  const tags = new InMemoryTagRepository(articles);

  const config = { jwtSecret: TEST_JWT_SECRET, jwtExpiry: '7d' as const, port: 0 };
  const authService = new AuthService(users, config);
  const profileService = new ProfileService(users, profiles);
  const articleService = new ArticleService(articles, users, profileService);
  const commentService = new CommentService(comments, articles, users, profileService);
  const tagService = new TagService(tags);

  const container: Container = {
    config,
    authService,
    profileService,
    articleService,
    commentService,
    tagService,
  };

  return { app: createApp(container), users, profiles, articles, comments, tags };
}
