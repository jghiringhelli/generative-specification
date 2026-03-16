
/**
 * Integration tests for article endpoints.
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import type { Express } from 'express';

const prisma = new PrismaClient();
let app: Express;

beforeAll(async () => {
  app = createApp(prisma);
});

beforeEach(async () => {
  await prisma.userFavorite.deleteMany();
  await prisma.userFollow.deleteMany();
  await prisma.articleTag.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/articles', () => {
  it('creates article and returns it with author', async () => {
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    const response = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'How to Train Your Dragon',
          description: 'Ever wonder how?',
          body: 'You have to believe',
          tagList: ['dragons', 'training']
        }
      })
      .expect(201);

    expect(response.body.article).toMatchObject({
      title: 'How to Train Your Dragon',
      description: 'Ever wonder how?',
      body: 'You have to believe',
      tagList: expect.arrayContaining(['dragons', 'training']),
      favorited: false,
      favoritesCount: 0,
      author: {
        username: 'testuser',
        bio: null,
        image: null,
        following: false
      }
    });
    expect(response.body.article.slug).toBeDefined();
  });

  it('returns 401 when not authenticated', async () => {
    const response = await request(app)
      .post('/api/articles')
      .send({
        article: {
          title: 'Test',
          description: 'Test',
          body: 'Test',
          tagList: []
        }
      })
      .expect(401);

    expect(response.body).toEqual({
      errors: { body: ['missing authorization token'] }
    });
  });

  it('returns 422 when title is missing', async () => {
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    const response = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          description: 'Test',
          body: 'Test'
        }
      })
      .expect(422);

    expect(response.body).toEqual({
      errors: { body: ["title can't be blank"] }
    });
  });
});

describe('GET /api/articles/:slug', () => {
  it('returns article with body field', async () => {
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    const createResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Test Article',
          description: 'Test description',
          body: 'Test body content',
          tagList: ['test']
        }
      });

    const slug = createResponse.body.article.slug;

    const response = await request(app).get(`/api/articles/${slug}`).expect(200);

    expect(response.body.article).toMatchObject({
      slug,
      title: 'Test Article',
      description: 'Test description',
      body: 'Test body content',
      tagList: ['test'],
      favorited: false,
      favoritesCount: 0
    });
  });

  it('returns 404 when article does not exist', async () => {
    await request(app).get('/api/articles/nonexistent-slug').expect(404);
  });
});

describe('GET /api/articles', () => {
  it('returns list of articles without body field', async () => {
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Article 1',
          description: 'Description 1',
          body: 'Body 1',
          tagList: ['tag1']
        }
      });

    const response = await request(app).get('/api/articles').expect(200);

    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articles[0]).toHaveProperty('title');
    expect(response.body.articles[0]).toHaveProperty('description');
    expect(response.body.articles[0]).not.toHaveProperty('body'); // Body NOT in list
    expect(response.body.articlesCount).toBe(1);
  });

  it('filters by tag', async () => {
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Dragons Article',
          description: 'About dragons',
          body: 'Content',
          tagList: ['dragons']
        }
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Cats Article',
          description: 'About cats',
          body: 'Content',
          tagList: ['cats']
        }
      });

    const response = await request(app).get('/api/articles?tag=dragons').expect(200);

    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articles[0].title).toBe('Dragons Article');
  });

  it('filters by author', async () => {
    const user1Response = await request(app).post('/api/users').send({
      user: { email: 'user1@example.com', username: 'user1', password: 'password123' }
    });
    const user2Response = await request(app).post('/api/users').send({
      user: { email: 'user2@example.com', username: 'user2', password: 'password123' }
    });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Response.body.user.token}`)
      .send({
        article: { title: 'User1 Article', description: 'Desc', body: 'Body', tagList: [] }
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user2Response.body.user.token}`)
      .send({
        article: { title: 'User2 Article', description: 'Desc', body: 'Body', tagList: [] }
      });

    const response = await request(app).get('/api/articles?author=user1').expect(200);

    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articles[0].author.username).toBe('user1');
  });

  it('paginates results', async () => {
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    // Create 3 articles
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: `Article ${i}`,
            description: 'Desc',
            body: 'Body',
            tagList: []
          }
        });
    }

    const response = await request(app).get('/api/articles?limit=2&offset=1').expect(200);

    expect(response.body.articles).toHaveLength(2);
    expect(response.body.articlesCount).toBe(3);
  });
});

describe('GET /api/articles/feed', () => {
  it('returns articles from followed users without body field', async () => {
    const user1Response = await request(app).post('/api/users').send({
      user: { email: 'user1@example.com', username: 'user1', password: 'password123' }
    });
    const user2Response = await request(app).post('/api/users').send({
      user: { email: 'user2@example.com', username: 'user2', password: 'password123' }
    });

    const token1 = user1Response.body.user.token;
    const token2 = user2Response.body.user.token;

    // User1 follows user2
    await request(app)
      .post('/api/profiles/user2/follow')
      .set('Authorization', `Token ${token1}`);

    // User2 creates article
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token2}`)
      .send({
        article: { title: 'User2 Article', description: 'Desc', body: 'Body content', tagList: [] }
      });

    // User1 gets feed
    const response = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', `Token ${token1}`)
      .expect(200);

    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articles[0]).not.toHaveProperty('body'); // Body NOT in feed
    expect(response.body.articles[0].author.username).toBe('user2');
  });

  it('returns 401 when not authenticated', async () => {
    const response = await request(app).get('/api/articles/feed').expect(401);

    expect(response.body).toEqual({
      errors: { body: ['missing authorization token'] }
    });
  });
});

describe('PUT /api/articles/:slug', () => {
  it('updates article when user is author', async () => {
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    const createResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: { title: 'Original Title', description: 'Desc', body: 'Body', tagList: [] }
      });

    const slug = createResponse.body.article.slug;

    const response = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${token}`)
      .send({
        article: { title: 'Updated Title' }
      })
      .expect(200);

    expect(response.body.article.title).toBe('Updated Title');
  });

  it('returns 403 when user is not author', async () => {
    const user1Response = await request(app).post('/api/users').send({
      user: { email: 'user1@example.com', username: 'user1', password: 'password123' }
    });
    const user2Response = await request(app).post('/api/users').send({
      user: { email: 'user2@example.com', username: 'user2', password: 'password123' }
    });

    const createResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Response.body.user.token}`)
      .send({
        article: { title: 'User1 Article', description: 'Desc', body: 'Body', tagList: [] }
      });

    const slug = createResponse.body.article.slug;

    const response = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${user2Response.body.user.token}`)
      .send({
        article: { title: 'Hacked' }
      })
      .expect(403);

    expect(response.body).toEqual({
      errors: { body: ['Only the author can update this article'] }
    });
  });
});

describe('DELETE /api/articles/:slug', () => {
  it('deletes article when user is author', async () => {
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    const createResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: { title: 'To Delete', description: 'Desc', body: 'Body', tagList: [] }
      });

    const slug = createResponse.body.article.slug;

    await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${token}`)
      .expect(200);

    // Verify deleted
    await request(app).get(`/api/articles/${slug}`).expect(404);
  });

  it('returns 403 when user is not author', async () => {
    const user1Response = await request(app).post('/api/users').send({
      user: { email: 'user1@example.com', username: 'user1', password: 'password123' }
    });
    const user2Response = await request(app).post('/api/users').send({
      user: { email: 'user2@example.com', username: 'user2', password: 'password123' }
    });

    const createResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Response.body.user.token}`)
      .send({
        article: { title: 'User1 Article', description: 'Desc', body: 'Body', tagList: [] }
      });

    const slug = createResponse.body.article.slug;

    const response = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${user2Response.body.user.token}`)
      .expect(403);

    expect(response.body).toEqual({
      errors: { body: ['Only the author can delete this article'] }
    });
  });
});

describe('POST /api/articles/:slug/favorite', () => {
  it('favorites article and increments count', async () => {
    const user1Response = await request(app).post('/api/users').send({
      user: { email: 'user1@example.com', username: 'user1', password: 'password123' }
    });
    const user2Response = await request(app).post('/api/users').send({
      user: { email: 'user2@example.com', username: 'user2', password: 'password123' }
    });

    const createResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Response.body.user.token}`)
      .send({
        article: { title: 'Article', description: 'Desc', body: 'Body', tagList: [] }
      });

    const slug = createResponse.body.article.slug;

    const response = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${user2Response.body.user.token}`)
      .expect(200);

    expect(response.body.article.favorited).toBe(true);
    expect(response.body.article.favoritesCount).toBe(1);
  });

  it('is idempotent when already favorited', async () => {
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    const createResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: { title: 'Article', description: 'Desc', body: 'Body', tagList: [] }
      });

    const slug = createResponse.body.article.slug;

    // Favorite once
    await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${token}`)
      .expect(200);

    // Favorite again
    const response = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${token}`)
      .expect(200);

    expect(response.body.article.favoritesCount).toBe(1);
  });
});

describe('DELETE /api/articles/:slug/favorite', () => {
  it('unfavorites article and decrements count', async () => {
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    const createResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: { title: 'Article', description: 'Desc', body: 'Body', tagList: [] }
      });

    const slug = createResponse.body.article.slug;

    // Favorite first
    await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${token}`);

    // Then unfavorite
    const response = await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${token}`)
      .expect(200);

    expect(response.body.article.favorited).toBe(false);
    expect(response.body.article.favoritesCount).toBe(0);
  });
});
