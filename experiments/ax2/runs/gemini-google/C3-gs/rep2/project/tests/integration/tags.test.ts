import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryUserRepository } from '../../src/repositories/in-memory/InMemoryUserRepository';
import { InMemoryProfileRepository } from '../../src/repositories/in-memory/InMemoryProfileRepository';
import { InMemoryArticleRepository } from '../../src/repositories/in-memory/InMemoryArticleRepository';
import { InMemoryTagRepository } from '../../src/repositories/in-memory/InMemoryTagRepository';
import { AuthService } from '../../src/services/AuthService';
import { ArticleService } from '../../src/services/ArticleService';
import { TagService } from '../../src/services/TagService';

describe('Tags Integration Tests (GET /api/tags)', () => {
  let app: any;
  let token: string;

  beforeEach(async () => {
    const userRepository = new InMemoryUserRepository();
    const profileRepository = new InMemoryProfileRepository(userRepository);
    const articleRepository = new InMemoryArticleRepository(userRepository, profileRepository);
    const tagRepository = new InMemoryTagRepository(articleRepository);

    process.env.JWT_SECRET = 'tags-test-secret';
    const authService = new AuthService(userRepository, 'tags-test-secret', '1h');
    const articleService = new ArticleService(articleRepository);
    const tagService = new TagService(tagRepository);

    app = createApp({
      userRepository,
      profileRepository,
      articleRepository,
      tagRepository,
      authService,
      articleService,
      tagService,
    });

    // Register user to post tagged articles
    const userRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'tagWriter',
          email: 'tagwriter@example.com',
          password: 'password123',
        },
      });
    token = userRes.body.user.token;

    // Create tagged articles
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Article with tags A and B',
          description: 'desc',
          body: 'body',
          tagList: ['training', 'dragons'],
        },
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Article with tags B and C',
          description: 'desc',
          body: 'body',
          tagList: ['dragons', 'flying'],
        },
      });
  });

  it('GET /api/tags should return 200 with unique list of tags across all articles', async () => {
    const response = await request(app).get('/api/tags');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tags');
    expect(Array.isArray(response.body.tags)).toBe(true);
    expect(response.body.tags).toHaveLength(3);
    expect(response.body.tags).toEqual(expect.arrayContaining(['training', 'dragons', 'flying']));
  });
});
