import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';
import { generateToken } from '../src/utils/jwt';

describe('Articles Endpoints', () => {
  let author: any;
  let reader: any;
  let authorToken: string;
  let readerToken: string;
  let createdArticleSlug: string;

  beforeAll(async () => {
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.follows.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: { in: ['author@example.com', 'reader@example.com'] }
      }
    });

    author = await prisma.user.create({
      data: {
        username: 'author_user',
        email: 'author@example.com',
        password: 'hashedpassword',
        bio: 'Author bio',
        image: ''
      }
    });

    reader = await prisma.user.create({
      data: {
        username: 'reader_user',
        email: 'reader@example.com',
        password: 'hashedpassword',
        bio: 'Reader bio',
        image: ''
      }
    });

    authorToken = generateToken({
      userId: author.id,
      email: author.email,
      username: author.username
    });

    readerToken = generateToken({
      userId: reader.id,
      email: reader.email,
      username: reader.username
    });
  });

  afterAll(async () => {
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.follows.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: { in: ['author@example.com', 'reader@example.com'] }
      }
    });
    await prisma.$disconnect();
  });

  it('POST /api/articles - should create an article', async () => {
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${authorToken}`)
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
    expect(res.body.article.tagList).toContain('dragons');
    expect(res.body.article.tagList).toContain('training');
    expect(res.body.article.author.username).toBe(author.username);
    createdArticleSlug = res.body.article.slug;
  });

  it('GET /api/articles/:slug - should get single article', async () => {
    const res = await request(app).get(`/api/articles/${createdArticleSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.article.slug).toBe(createdArticleSlug);
  });

  it('GET /api/articles - should list articles with tag filter', async () => {
    const res = await request(app).get('/api/articles?tag=dragons');
    expect(res.status).toBe(200);
    expect(res.body.articles.length).toBeGreaterThanOrEqual(1);
    expect(res.body.articlesCount).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/articles/:slug/favorite - should favorite an article', async () => {
    const res = await request(app)
      .post(`/api/articles/${createdArticleSlug}/favorite`)
      .set('Authorization', `Token ${readerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.article.favorited).toBe(true);
    expect(res.body.article.favoritesCount).toBe(1);
  });

  it('DELETE /api/articles/:slug/favorite - should unfavorite an article', async () => {
    const res = await request(app)
      .delete(`/api/articles/${createdArticleSlug}/favorite`)
      .set('Authorization', `Token ${readerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.article.favorited).toBe(false);
    expect(res.body.article.favoritesCount).toBe(0);
  });

  it('PUT /api/articles/:slug - should update article', async () => {
    const res = await request(app)
      .put(`/api/articles/${createdArticleSlug}`)
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          description: 'Updated description'
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.article.description).toBe('Updated description');
  });

  it('GET /api/articles/feed - should return articles of followed users', async () => {
    // reader follows author
    await prisma.follows.create({
      data: {
        followerId: reader.id,
        followingId: author.id
      }
    });

    const res = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', `Token ${readerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.articles.length).toBeGreaterThanOrEqual(1);
    expect(res.body.articles[0].author.username).toBe(author.username);
  });

  it('DELETE /api/articles/:slug - should delete article', async () => {
    const res = await request(app)
      .delete(`/api/articles/${createdArticleSlug}`)
      .set('Authorization', `Token ${authorToken}`);

    expect(res.status).toBe(200);

    const getRes = await request(app).get(`/api/articles/${createdArticleSlug}`);
    expect(getRes.status).toBe(404);
  });
});
