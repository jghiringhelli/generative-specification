import { Application } from 'express';
import { buildApp } from '../../src/app';
import { Container } from '../../src/container/container';
import { AuthService } from '../../src/services/AuthService';
import { ProfileService } from '../../src/services/ProfileService';
import { ArticleService } from '../../src/services/ArticleService';
import { CommentService } from '../../src/services/CommentService';
import { TagService } from '../../src/services/TagService';
import { JwtTokenService } from '../../src/services/adapters/JwtTokenService';
import { IPasswordHasher } from '../../src/services/ports/IPasswordHasher';
import {
  InMemoryArticleRepository,
  InMemoryCommentRepository,
  InMemoryProfileRepository,
  InMemoryStore,
  InMemoryTagRepository,
  InMemoryUserRepository,
} from './inMemory';

/**
 * Deterministic password hasher fake for tests: no native argon2 dependency and
 * fast. Encodes as `hashed:<plain>` and verifies by comparison.
 */
export class FakePasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}

export interface TestHarness {
  app: Application;
  store: InMemoryStore;
  container: Container;
}

/**
 * Build an Express app backed entirely by in-memory fakes for integration tests.
 * @returns the app, its backing store, and the wired container.
 */
export function buildTestHarness(): TestHarness {
  const store = new InMemoryStore();
  const users = new InMemoryUserRepository(store);
  const profiles = new InMemoryProfileRepository(store);
  const articles = new InMemoryArticleRepository(store);
  const comments = new InMemoryCommentRepository(store);
  const tags = new InMemoryTagRepository(store);

  const tokens = new JwtTokenService('test-secret', '7d');
  const passwords = new FakePasswordHasher();

  const container: Container = {
    tokens,
    authService: new AuthService(users, passwords, tokens),
    profileService: new ProfileService(profiles),
    articleService: new ArticleService(articles, profiles),
    commentService: new CommentService(comments, articles, profiles),
    tagService: new TagService(tags),
  };

  return { app: buildApp(container), store, container };
}
