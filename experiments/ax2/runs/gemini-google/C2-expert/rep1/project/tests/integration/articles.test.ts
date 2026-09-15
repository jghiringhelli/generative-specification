import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/db/prisma';

describe('Articles Integration Tests', () => {
  let user1Token: string;
  let user1Username: string;
  let user2Token: string;
  let user2Username: string;

  beforeEach(async () => {
    await prisma.follow.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();

    const u1 = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'author1',
          email: 'author1@example.com',
          password: 'password123'
        }
      });
    user1Token = u1.body.user.token;
    user1Username = u1.body.user.username;

    const u2 = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'author2',
          email: 'author2@example.com',
          password: 'password123'
        }
      });
    user2Token = u2.body.user.token;
    user2Username = u2.body.user.username;
  });

  afterAll(async () => {
    await prisma.follow.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('creates an article successfully and returns single article with body and slug', async () => {
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          title: 'How to train your dragon',
          description: 'Ever wonder how?',
          body: 'It takes a Jacobian',
          tagList: ['dragons', 'training']
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.article).toBeDefined();
    expect(res.body.article.title).toBe('How to train your dragon');
    expect(res.body.article.description).toBe('Ever wonder how?');
    expect(res.body.article.body).toBe('It takes a Jacobian');
    expect(res.body.article.tagList).toEqual(expect.arrayContaining(['dragons', 'training']));
    expect(res.body.article.slug).toMatch(/^how-to-train-your-dragon-\d+$/);
    expect(res.body.article.author.username).toBe(user1Username);
  });

  it('retrieves a single article by slug including body', async () => {
    const createRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          title: 'Single Article Test',
          description: 'A test description',
          body: 'Full detailed body content here',
          tagList: ['testing']
        }
      });

    const slug = createRes.body.article.slug;

    const res = await request(app).get(`/api/articles/${slug}`);

    expect(res.status).toBe(200);
    expect(res.body.article.slug).toBe(slug);
    expect(res.body.article.body).toBe('Full detailed body content here');
  });

  it('updates an article when requested by its author', async () => {
    const createRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          title: 'Original Title',
          description: 'Original Desc',
          body: 'Original Body',
          tagList: ['initial']
        }
      });

    const slug = createRes.body.article.slug;

    const res = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          description: 'Updated Description',
          body: 'Updated Body'
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.article.description).toBe('Updated Description');
    expect(res.body.article.body).toBe('Updated Body');
  });

  it('returns 403 when updating an article authored by another user', async () => {
    const createRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          title: 'Author1 Article',
          description: 'Desc',
          body: 'Body'
        }
      });

    const slug = createRes.body.article.slug;

    const res = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${user2Token}`)
      .send({
        article: {
          body: 'Hacked body'
        }
      });

    expect(res.status).toBe(403);
    expect(res.body.errors.body).toContain('You are not authorized to edit this article');
  });

  it('returns 403 when deleting an article authored by another user', async () => {
    const createRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          title: 'Undeletable Article',
          description: 'Desc',
          body: 'Body'
        }
      });

    const slug = createRes.body.article.slug;

    const res = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${user2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.errors.body).toContain('You are not authorized to delete this article');
  });

  it('deletes an article successfully when requested by author', async () => {
    const createRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          title: 'Article to Delete',
          description: 'Desc',
          body: 'Body'
        }
      });

    const slug = createRes.body.article.slug;

    const deleteRes = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${user1Token}`);

    expect(deleteRes.status).toBe(200);

    const getRes = await request(app).get(`/api/articles/${slug}`);
    expect(getRes.status).toBe(404);
  });

  it('lists articles without filter and omits body in article items', async () => {
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          title: 'First Article',
          description: 'Desc 1',
          body: 'Secret body 1',
          tagList: ['news']
        }
      });

    const res = await request(app).get('/api/articles');

    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles).toHaveLength(1);
    expect(res.body.articles[0].body).toBeUndefined();
    expect(res.body.articles[0].title).toBe('First Article');
  });

  it('filters articles by tag', async () => {
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          title: 'TypeScript Article',
          description: 'Desc TS',
          body: 'Body TS',
          tagList: ['typescript']
        }
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          title: 'Rust Article',
          description: 'Desc Rust',
          body: 'Body Rust',
          tagList: ['rust']
        }
      });

    const res = await request(app).get('/api/articles?tag=typescript');

    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].title).toBe('TypeScript Article');
  });

  it('filters articles by author username', async () => {
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          title: 'Author1 Post',
          description: 'Desc',
          body: 'Body'
        }
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user2Token}`)
      .send({
        article: {
          title: 'Author2 Post',
          description: 'Desc',
          body: 'Body'
        }
      });

    const res = await request(app).get(`/api/articles?author=${user1Username}`);

    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].title).toBe('Author1 Post');
  });

  it('favorites and unfavorites an article correctly and filters by favorited username', async () => {
    const createRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          title: 'Article to Favorite',
          description: 'Desc',
          body: 'Body'
        }
      });

    const slug = createRes.body.article.slug;

    // Favorite article
    const favRes = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${user2Token}`);

    expect(favRes.status).toBe(200);
    expect(favRes.body.article.favorited).toBe(true);
    expect(favRes.body.article.favoritesCount).toBe(1);

    // Filter by favorited
    const filterRes = await request(app).get(`/api/articles?favorited=${user2Username}`);
    expect(filterRes.status).toBe(200);
    expect(filterRes.body.articlesCount).toBe(1);
    expect(filterRes.body.articles[0].slug).toBe(slug);

    // Unfavorite article
    const unfavRes = await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${user2Token}`);

    expect(unfavRes.status).toBe(200);
    expect(unfavRes.body.article.favorited).toBe(false);
    expect(unfavRes.body.article.favoritesCount).toBe(0);
  });

  it('paginates articles using limit and offset parameters', async () => {
    for (let i = 1; i <= 3; i++) {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: `Article Number ${i}`,
            description: 'Desc',
            body: 'Body'
          }
        });
    }

    const res = await request(app).get('/api/articles?limit=2&offset=1');

    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(3);
    expect(res.body.articles).toHaveLength(2);
  });

  it('returns articles in feed only from followed users and omits body', async () => {
    // User2 follows User1
    await request(app)
      .post(`/api/profiles/${user1Username}/follow`)
      .set('Authorization', `Token ${user2Token}`);

    // User1 creates an article
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          title: 'Followed Author Post',
          description: 'Desc',
          body: 'Secret Feed Body'
        }
      });

    const res = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', `Token ${user2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles).toHaveLength(1);
    expect(res.body.articles[0].body).toBeUndefined();
    expect(res.body.articles[0].title).toBe('Followed Author Post');
  });

  describe('Authentication enforcement on article endpoints', () => {
    it('returns 401 when accessing feed without auth token', async () => {
      const res = await request(app).get('/api/articles/feed');
      expect(res.status).toBe(401);
    });

    it('returns 401 when creating article without auth token', async () => {
      const res = await request(app)
        .post('/api/articles')
        .send({
          article: {
            title: 'No Auth Title',
            description: 'Desc',
            body: 'Body'
          }
        });
      expect(res.status).toBe(401);
    });

    it('returns 401 when updating article without auth token', async () => {
      const res = await request(app)
        .put('/api/articles/some-slug')
        .send({
          article: {
            description: 'New Desc'
          }
        });
      expect(res.status).toBe(401);
    });

    it('returns 401 when deleting article without auth token', async () => {
      const res = await request(app).delete('/api/articles/some-slug');
      expect(res.status).toBe(401);
    });

    it('returns 401 when favoriting article without auth token', async () => {
      const res = await request(app).post('/api/articles/some-slug/favorite');
      expect(res.status).toBe(401);
    });

    it('returns 401 when unfavoriting article without auth token', async () => {
      const res = await request(app).delete('/api/articles/some-slug/favorite');
      expect(res.status).toBe(401);
    });
  });

  describe('Error responses for invalid requests and non-existent articles', () => {
    it('returns 404 when requesting a non-existent article slug', async () => {
      const res = await request(app).get('/api/articles/non-existent-slug-123');
      expect(res.status).toBe(404);
      expect(res.body.errors).toBeDefined();
    });

    it('returns 404 when updating a non-existent article slug', async () => {
      const res = await request(app)
        .put('/api/articles/non-existent-slug-123')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            description: 'New Description'
          }
        });
      expect(res.status).toBe(404);
    });

    it('returns 404 when deleting a non-existent article slug', async () => {
      const res = await request(app)
        .delete('/api/articles/non-existent-slug-123')
        .set('Authorization', `Token ${user1Token}`);
      expect(res.status).toBe(404);
    });

    it('returns 404 when favoriting a non-existent article slug', async () => {
      const res = await request(app)
        .post('/api/articles/non-existent-slug-123/favorite')
        .set('Authorization', `Token ${user1Token}`);
      expect(res.status).toBe(404);
    });

    it('returns 404 when unfavoriting a non-existent article slug', async () => {
      const res = await request(app)
        .delete('/api/articles/non-existent-slug-123/favorite')
        .set('Authorization', `Token ${user1Token}`);
      expect(res.status).toBe(404);
    });

    it('returns 422 when creating an article with missing required fields', async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: ''
          }
        });
      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });
  });
});
