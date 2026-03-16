import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { Express } from 'express';

const prisma = new PrismaClient();
let app: Express;

beforeAll(async () => {
  app = createApp(prisma);
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.userFavorite.deleteMany();
  await prisma.userFollow.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.articleTag.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
});

async function createUser(username: string, email: string) {
  const response = await request(app)
    .post('/api/users')
    .send({
      user: {
        email,
        username,
        password: 'password123'
      }
    });
  return response.body.user.token;
}

describe('POST /api/articles', () => {
  let token: string;

  beforeEach(async () => {
    token = await createUser('jake', 'jake@jake.jake');
  });

  it('create_article_with_valid_data_returns_201_with_article', async () => {
    const response = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'How to train your dragon',
          description: 'Ever wonder how?',
          body: 'You have to believe',
          tagList: ['reactjs', 'angularjs', 'dragons']
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.article.slug).toBe('how-to-train-your-dragon');
    expect(response.body.article.title).toBe('How to train your dragon');
    expect(response.body.article.description).toBe('Ever wonder how?');
    expect(response.body.article.body).toBe('You have to believe');
    expect(response.body.article.tagList).toEqual(['reactjs', 'angularjs', 'dragons']);
    expect(response.body.article.favorited).toBe(false);
    expect(response.body.article.favoritesCount).toBe(0);
    expect(response.body.article.author.username).toBe('jake');
  });

  it('create_article_without_auth_returns_401', async () => {
    const response = await request(app)
      .post('/api/articles')
      .send({
        article: {
          title: 'Test',
          description: 'Test',
          body: 'Test'
        }
      });

    expect(response.status).toBe(401);
  });

  it('create_article_without_title_returns_422', async () => {
    const response = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          description: 'Test',
          body: 'Test'
        }
      });

    expect(response.status).toBe(422);
  });

  it('create_article_with_duplicate_title_generates_unique_slug', async () => {
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Same Title',
          description: 'First',
          body: 'First'
        }
      });

    const response = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Same Title',
          description: 'Second',
          body: 'Second'
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.article.slug).toBe('same-title-1');
  });
});

describe('GET /api/articles/:slug', () => {
  let token: string;
  let slug: string;

  beforeEach(async () => {
    token = await createUser('jake', 'jake@jake.jake');

    const createResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Test Article',
          description: 'Test description',
          body: 'Test body',
          tagList: ['test']
        }
      });

    slug = createResponse.body.article.slug;
  });

  it('get_existing_article_returns_200_with_article_including_body', async () => {
    const response = await request(app).get(`/api/articles/${slug}`);

    expect(response.status).toBe(200);
    expect(response.body.article.slug).toBe(slug);
    expect(response.body.article.title).toBe('Test Article');
    expect(response.body.article.body).toBe('Test body');
    expect(response.body.article.tagList).toEqual(['test']);
  });

  it('get_nonexistent_article_returns_404', async () => {
    const response = await request(app).get('/api/articles/nonexistent-slug');

    expect(response.status).toBe(404);
  });
});

describe('PUT /api/articles/:slug', () => {
  let authorToken: string;
  let otherToken: string;
  let slug: string;

  beforeEach(async () => {
    authorToken = await createUser('jake', 'jake@jake.jake');
    otherToken = await createUser('alice', 'alice@alice.alice');

    const createResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          title: 'Original Title',
          description: 'Original description',
          body: 'Original body'
        }
      });

    slug = createResponse.body.article.slug;
  });

  it('update_article_by_author_returns_200_with_updated_article', async () => {
    const response = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          title: 'Updated Title',
          description: 'Updated description'
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.article.title).toBe('Updated Title');
    expect(response.body.article.description).toBe('Updated description');
    expect(response.body.article.body).toBe('Original body');
  });

  it('update_article_title_updates_slug', async () => {
    const response = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          title: 'New Title'
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.article.slug).toBe('new-title');
  });

  it('update_article_by_non_author_returns_403', async () => {
    const response = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${otherToken}`)
      .send({
        article: {
          title: 'Hacked Title'
        }
      });

    expect(response.status).toBe(403);
  });

  it('update_article_without_auth_returns_401', async () => {
    const response = await request(app)
      .put(`/api/articles/${slug}`)
      .send({
        article: {
          title: 'Unauthorized Update'
        }
      });

    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/articles/:slug', () => {
  let authorToken: string;
  let otherToken: string;
  let slug: string;

  beforeEach(async () => {
    authorToken = await createUser('jake', 'jake@jake.jake');
    otherToken = await createUser('alice', 'alice@alice.alice');

    const createResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          title: 'To Be Deleted',
          description: 'Will be deleted',
          body: 'Goodbye'
        }
      });

    slug = createResponse.body.article.slug;
  });

  it('delete_article_by_author_returns_200', async () => {
    const response = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${authorToken}`);

    expect(response.status).toBe(200);

    const getResponse = await request(app).get(`/api/articles/${slug}`);
    expect(getResponse.status).toBe(404);
  });

  it('delete_article_by_non_author_returns_403', async () => {
    const response = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${otherToken}`);

    expect(response.status).toBe(403);
  });

  it('delete_article_without_auth_returns_401', async () => {
    const response = await request(app).delete(`/api/articles/${slug}`);

    expect(response.status).toBe(401);
  });
});

describe('GET /api/articles', () => {
  let token: string;

  beforeEach(async () => {
    token = await createUser('jake', 'jake@jake.jake');

    // Create multiple articles
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Article 1',
          description: 'First',
          body: 'Body 1',
          tagList: ['reactjs']
        }
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Article 2',
          description: 'Second',
          body: 'Body 2',
          tagList: ['angularjs']
        }
      });
  });

  it('list_articles_returns_200_with_articles_array_without_body_field', async () => {
    const response = await request(app).get('/api/articles');

    expect(response.status).toBe(200);
    expect(response.body.articles).toHaveLength(2);
    expect(response.body.articlesCount).toBe(2);
    expect(response.body.articles[0].body).toBeUndefined(); // Body not in list
    expect(response.body.articles[0].title).toBeDefined();
    expect(response.body.articles[0].description).toBeDefined();
  });

  it('list_articles_with_tag_filter_returns_filtered_results', async () => {
    const response = await request(app).get('/api/articles?tag=reactjs');

    expect(response.status).toBe(200);
    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articles[0].tagList).toContain('reactjs');
  });

  it('list_articles_with_author_filter_returns_filtered_results', async () => {
    const response = await request(app).get('/api/articles?author=jake');

    expect(response.status).toBe(200);
    expect(response.body.articles).toHaveLength(2);
  });

  it('list_articles_with_limit_returns_paginated_results', async () => {
    const response = await request(app).get('/api/articles?limit=1');

    expect(response.status).toBe(200);
    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articlesCount).toBe(2);
  });

  it('list_articles_with_offset_returns_second_page', async () => {
    const response = await request(app).get('/api/articles?limit=1&offset=1');

    expect(response.status).toBe(200);
    expect(response.body.articles).toHaveLength(1);
  });
});

describe('GET /api/articles/feed', () => {
  let aliceToken: string;
  let bobToken: string;

  beforeEach(async () => {
    aliceToken = await createUser('alice', 'alice@alice.alice');
    bobToken = await createUser('bob', 'bob@bob.bob');

    // Bob creates articles
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${bobToken}`)
      .send({
        article: {
          title: 'Bob Article 1',
          description: 'By Bob',
          body: 'Content'
        }
      });

    // Alice follows Bob
    await request(app)
      .post('/api/profiles/bob/follow')
      .set('Authorization', `Token ${aliceToken}`);
  });

  it('get_feed_returns_articles_from_followed_users_without_body_field', async () => {
    const response = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', `Token ${aliceToken}`);

    expect(response.status).toBe(200);
    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articles[0].author.username).toBe('bob');
    expect(response.body.articles[0].body).toBeUndefined();
  });

  it('get_feed_without_auth_returns_401', async () => {
    const response = await request(app).get('/api/articles/feed');

    expect(response.status).toBe(401);
  });

  it('get_feed_with_no_follows_returns_empty_array', async () => {
    const charlieToken = await createUser('charlie', 'charlie@charlie.charlie');

    const response = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', `Token ${charlieToken}`);

    expect(response.status).toBe(200);
    expect(response.body.articles).toHaveLength(0);
    expect(response.body.articlesCount).toBe(0);
  });
});

describe('POST /api/articles/:slug/favorite', () => {
  let token: string;
  let slug: string;

  beforeEach(async () => {
    token = await createUser('jake', 'jake@jake.jake');

    const createResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Article to Favorite',
          description: 'Test',
          body: 'Test'
        }
      });

    slug = createResponse.body.article.slug;
  });

  it('favorite_article_returns_200_with_favorited_true', async () => {
    const response = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.article.favorited).toBe(true);
    expect(response.body.article.favoritesCount).toBe(1);
  });

  it('favorite_article_without_auth_returns_401', async () => {
    const response = await request(app).post(`/api/articles/${slug}/favorite`);

    expect(response.status).toBe(401);
  });

  it('favorite_already_favorited_article_returns_422', async () => {
    await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${token}`);

    const response = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${token}`);

    expect(response.status).toBe(422);
  });
});

describe('DELETE /api/articles/:slug/favorite', () => {
  let token: string;
  let slug: string;

  beforeEach(async () => {
    token = await createUser('jake', 'jake@jake.jake');

    const createResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Article to Unfavorite',
          description: 'Test',
          body: 'Test'
        }
      });

    slug = createResponse.body.article.slug;

    // Favorite it first
    await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${token}`);
  });

  it('unfavorite_article_returns_200_with_favorited_false', async () => {
    const response = await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.article.favorited).toBe(false);
    expect(response.body.article.favoritesCount).toBe(0);
  });

  it('unfavorite_article_without_auth_returns_401', async () => {
    const response = await request(app).delete(`/api/articles/${slug}/favorite`);

    expect(response.status).toBe(401);
  });

  it('unfavorite_not_favorited_article_returns_422', async () => {
    // Unfavorite once
    await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${token}`);

    // Try again
    const response = await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${token}`);

    expect(response.status).toBe(422);
  });
});
