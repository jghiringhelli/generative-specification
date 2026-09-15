import { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../src/app';
import { Container } from '../../src/config/container';
import { AppConfig } from '../../src/config/env';
import { AuthService } from '../../src/services/AuthService';
import { ProfileService } from '../../src/services/ProfileService';
import { ArticleService } from '../../src/services/ArticleService';
import { CommentService } from '../../src/services/CommentService';
import { TagService } from '../../src/services/TagService';
import { InMemoryUserRepository } from './InMemoryUserRepository';
import { InMemoryProfileRepository } from './InMemoryProfileRepository';
import { InMemoryArticleRepository } from './InMemoryArticleRepository';
import { InMemoryCommentRepository } from './InMemoryCommentRepository';
import { InMemoryTagRepository } from './InMemoryTagRepository';
import { FakePasswordHasher } from './FakePasswordHasher';

/**
 * The in-memory repositories and services used by a test app, exposed so tests
 * can seed data and assert persistence state directly.
 */
export interface TestHarness {
  app: Express;
  config: AppConfig;
  userRepository: InMemoryUserRepository;
  profileRepository: InMemoryProfileRepository;
  articleRepository: InMemoryArticleRepository;
  commentRepository: InMemoryCommentRepository;
  tagRepository: InMemoryTagRepository;
  passwordHasher: FakePasswordHasher;
  authService: AuthService;
  profileService: ProfileService;
  articleService: ArticleService;
  commentService: CommentService;
  tagService: TagService;
}

/**
 * Build a fully wired Express app backed by in-memory fakes for integration
 * tests. No database is required.
 * @returns The test harness.
 */
export function buildTestHarness(): TestHarness {
  const config: AppConfig = {
    databaseUrl: 'postgresql://test',
    jwtSecret: 'test-secret',
    jwtExpiry: '7d',
    port: 0
  };

  const userRepository = new InMemoryUserRepository();
  const profileRepository = new InMemoryProfileRepository();
  const articleRepository = new InMemoryArticleRepository(userRepository);
  const commentRepository = new InMemoryCommentRepository();
  const tagRepository = new InMemoryTagRepository(articleRepository);
  const passwordHasher = new FakePasswordHasher();
  const authService = new AuthService(userRepository, passwordHasher, config.jwtSecret);
  const profileService = new ProfileService(userRepository, profileRepository);
  const articleService = new ArticleService(articleRepository, userRepository, profileRepository);
  const commentService = new CommentService(
    commentRepository,
    articleRepository,
    userRepository,
    profileRepository
  );
  const tagService = new TagService(tagRepository);

  const container: Container = {
    config,
    userRepository,
    profileRepository,
    articleRepository,
    commentRepository,
    tagRepository,
    authService,
    profileService,
    articleService,
    commentService,
    tagService
  };

  return {
    app: createApp(container),
    config,
    userRepository,
    profileRepository,
    articleRepository,
    commentRepository,
    tagRepository,
    passwordHasher,
    authService,
    profileService,
    articleService,
    commentService,
    tagService
  };
}

/**
 * Register a user through the API for test setup.
 * @param app - The Express app under test.
 * @param overrides - Optional field overrides.
 * @returns The issued token and the username.
 */
export async function registerTestUser(
  app: Express,
  overrides: Partial<{ username: string; email: string; password: string }> = {}
): Promise<{ token: string; username: string }> {
  const user = {
    username: overrides.username ?? 'jane',
    email: overrides.email ?? 'jane@example.com',
    password: overrides.password ?? 'secret123'
  };
  const res = await request(app).post('/api/users').send({ user });
  return { token: res.body.user.token, username: user.username };
}

/**
 * Create an article through the API for test setup.
 * @param app - The Express app under test.
 * @param token - The author's auth token.
 * @param overrides - Optional article field overrides.
 * @returns The created article slug.
 */
export async function createTestArticle(
  app: Express,
  token: string,
  overrides: Partial<{ title: string; description: string; body: string; tagList: string[] }> = {}
): Promise<string> {
  const article = {
    title: overrides.title ?? 'How to Train Your Dragon',
    description: overrides.description ?? 'Ever wonder how?',
    body: overrides.body ?? 'It takes a Jacobian',
    tagList: overrides.tagList ?? ['dragons', 'training']
  };
  const res = await request(app)
    .post('/api/articles')
    .set('Authorization', `Token ${token}`)
    .send({ article });
  return res.body.article.slug;
}
