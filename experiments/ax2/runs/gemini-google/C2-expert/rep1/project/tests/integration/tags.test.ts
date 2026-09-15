import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/db/prisma';

describe('Tags Integration Tests', () => {
  let userToken: string;

  beforeEach(async () => {
    await prisma.follow.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();

    const u = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'tagauthor',
          email: 'tagauthor@example.com',
          password: 'password123'
        }
      });
    userToken = u.body.user.token;
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

  it('lists empty tags array when no articles or tags exist', async () => {
    const res = await request(app).get('/api/tags');

    expect(res.status).toBe(200);
    expect(res.body.tags).toBeDefined();
    expect(res.body.tags).toEqual([]);
  });

  it('lists distinct tags after articles with tags are created', async () => {
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${userToken}`)
      .send({
        article: {
          title: 'Article 1',
          description: 'Desc 1',
          body: 'Body 1',
          tagList: ['dragons', 'training']
        }
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${userToken}`)
      .send({
        article: {
          title: 'Article 2',
          description: 'Desc 2',
          body: 'Body 2',
          tagList: ['dragons', 'flying']
        }
      });

    const res = await request(app).get('/api/tags');

    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual(expect.arrayContaining(['dragons', 'training', 'flying']));
    expect(res.body.tags).toHaveLength(3);
  });

  it('filters articles by tag matching persisted tags', async () => {
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${userToken}`)
      .send({
        article: {
          title: 'NodeJS Guide',
          description: 'Learn Node',
          body: 'Node content',
          tagList: ['backend', 'nodejs']
        }
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${userToken}`)
      .send({
        article: {
          title: 'React Guide',
          description: 'Learn React',
          body: 'React content',
          tagList: ['frontend', 'reactjs']
        }
      });

    const res = await request(app).get('/api/articles?tag=nodejs');

    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].title).toBe('NodeJS Guide');
    expect(res.body.articles[0].tagList).toContain('nodejs');
  });
});
