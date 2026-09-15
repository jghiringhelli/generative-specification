import request from 'supertest';
import { createApp } from '../../src/app';
import { getPrismaClient } from '../../src/repositories/prisma.client';
import { clearDatabase } from '../helpers/db.helper';

describe('Article CRUD and Favorites Integration', () => {
  const app = createApp();
  const prisma = getPrismaClient();

  let authorToken: string;
  let otherUserToken: string;

  beforeEach(async () => {
    await clearDatabase(prisma);

    const authorRes = await request(app)
      .post('/api/users')
      .send({
        user: { username: 'author1', email: 'author1@example.com', password: 'password123' },
      });
    authorToken = authorRes.body.user.token;

    const otherRes = await request(app)
      .post('/api/users')
      .send({
        user: { username: 'otheruser', email: 'other@example.com', password: 'password123' },
      });
    otherUserToken = otherRes.body.user.token;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  it('creates an article successfully and returns 201 with body and tags', async () => {
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          title: 'First Article Title',
          description: 'Description of the article',
          body: 'Full content of the article body',
          tagList: ['nodejs', 'express'],
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.article).toBeDefined();
    expect(res.body.article.slug).toMatch(/^first-article-title-/);
    expect(res.body.article.body).toBe('Full content of the article body');
    expect(res.body.article.tagList).toEqual(expect.arrayContaining(['nodejs', 'express']));
    expect(res.body.article.favorited).toBe(false);
  });

  it('retrieves a single article by slug including its body', async () => {
    const createRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          title: 'Single Read Test',
          description: 'Test description',
          body: 'Single article detailed body content',
        },
      });

    const slug = createRes.body.article.slug;
    const res = await request(app).get(`/api/articles/${slug}`);

    expect(res.status).toBe(200);
    expect(res.body.article.slug).toBe(slug);
    expect(res.body.article.body).toBe('Single article detailed body content');
  });

  it('updates an article successfully by its author', async () => {
    const createRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          title: 'Original Title',
          description: 'Original description',
          body: 'Original body',
        },
      });

    const slug = createRes.body.article.slug;
    const res = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: { description: 'Updated description' },
      });

    expect(res.status).toBe(200);
    expect(res.body.article.description).toBe('Updated description');
  });

  it('returns 403 when a non-author attempts to delete an article', async () => {
    const createRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          title: 'Protected Article',
          description: 'Protected description',
          body: 'Body',
        },
      });

    const slug = createRes.body.article.slug;
    const res = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${otherUserToken}`);

    expect(res.status).toBe(403);
    expect(res.body.errors.body).toBeDefined();
  });

  it('deletes an article successfully when performed by author', async () => {
    const createRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          title: 'To Be Deleted',
          description: 'Description',
          body: 'Body',
        },
      });

    const slug = createRes.body.article.slug;
    const deleteRes = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${authorToken}`);

    expect(deleteRes.status).toBe(200);

    const getRes = await request(app).get(`/api/articles/${slug}`);
    expect(getRes.status).toBe(404);
  });

  it('favorites and unfavorites an article correctly updating count', async () => {
    const createRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          title: 'Favorite Candidate',
          description: 'Description',
          body: 'Body',
        },
      });

    const slug = createRes.body.article.slug;

    const favRes = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${otherUserToken}`);

    expect(favRes.status).toBe(200);
    expect(favRes.body.article.favorited).toBe(true);
    expect(favRes.body.article.favoritesCount).toBe(1);

    const unfavRes = await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${otherUserToken}`);

    expect(unfavRes.status).toBe(200);
    expect(unfavRes.body.article.favorited).toBe(false);
    expect(unfavRes.body.article.favoritesCount).toBe(0);
  });

  it('returns 401 when creating article without authentication token', async () => {
    const res = await request(app)
      .post('/api/articles')
      .send({
        article: { title: 'No Auth', description: 'Desc', body: 'Body' },
      });
    expect(res.status).toBe(401);
  });

  it('returns 401 when updating article without authentication token', async () => {
    const res = await request(app)
      .put('/api/articles/any-slug')
      .send({ article: { title: 'New' } });
    expect(res.status).toBe(401);
  });

  it('returns 401 when deleting article without authentication token', async () => {
    const res = await request(app).delete('/api/articles/any-slug');
    expect(res.status).toBe(401);
  });

  it('returns 401 when favoriting article without authentication token', async () => {
    const res = await request(app).post('/api/articles/any-slug/favorite');
    expect(res.status).toBe(401);
  });

  it('returns 401 when unfavoriting article without authentication token', async () => {
    const res = await request(app).delete('/api/articles/any-slug/favorite');
    expect(res.status).toBe(401);
  });

  it('returns 404 when getting non-existent article slug', async () => {
    const res = await request(app).get('/api/articles/non-existent-article-slug');
    expect(res.status).toBe(404);
  });
});
