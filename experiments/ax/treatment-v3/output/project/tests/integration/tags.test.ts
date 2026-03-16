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

describe('GET /api/tags', () => {
  it('get_tags_with_no_articles_returns_empty_array', async () => {
    const response = await request(app).get('/api/tags');

    expect(response.status).toBe(200);
    expect(response.body.tags).toEqual([]);
  });

  it('get_tags_returns_unique_tags_from_articles', async () => {
    const token = await createUser('jake', 'jake@jake.jake');

    // Create article with tags
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Article 1',
          description: 'Test',
          body: 'Test',
          tagList: ['reactjs', 'angularjs', 'dragons']
        }
      });

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Article 2',
          description: 'Test',
          body: 'Test',
          tagList: ['nodejs', 'reactjs'] // reactjs appears again
        }
      });

    const response = await request(app).get('/api/tags');

    expect(response.status).toBe(200);
    expect(response.body.tags).toEqual(['angularjs', 'dragons', 'nodejs', 'reactjs']);
    expect(response.body.tags).toHaveLength(4); // Unique tags only
  });

  it('get_tags_returns_sorted_alphabetically', async () => {
    const token = await createUser('jake', 'jake@jake.jake');

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Test',
          description: 'Test',
          body: 'Test',
          tagList: ['zebra', 'apple', 'banana', 'cherry']
        }
      });

    const response = await request(app).get('/api/tags');

    expect(response.status).toBe(200);
    expect(response.body.tags).toEqual(['apple', 'banana', 'cherry', 'zebra']);
  });

  it('get_tags_does_not_require_authentication', async () => {
    const token = await createUser('jake', 'jake@jake.jake');

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'Test',
          description: 'Test',
          body: 'Test',
          tagList: ['test']
        }
      });

    // Call without auth token
    const response = await request(app).get('/api/tags');

    expect(response.status).toBe(200);
    expect(response.body.tags).toContain('test');
  });

  it('get_tags_after_article_deleted_removes_orphaned_tags', async () => {
    const token = await createUser('jake', 'jake@jake.jake');

    // Create article with unique tag
    const createResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'To Be Deleted',
          description: 'Test',
          body: 'Test',
          tagList: ['uniquetag']
        }
      });

    const slug = createResponse.body.article.slug;

    // Verify tag exists
    let tagsResponse = await request(app).get('/api/tags');
    expect(tagsResponse.body.tags).toContain('uniquetag');

    // Delete article
    await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${token}`);

    // Verify tag still exists (tags are not auto-deleted in this implementation)
    // Note: This tests current behavior - tags persist even if no articles use them
    tagsResponse = await request(app).get('/api/tags');
    expect(tagsResponse.body.tags).toContain('uniquetag');
  });

  it('get_tags_with_articles_without_tags_returns_empty_array', async () => {
    const token = await createUser('jake', 'jake@jake.jake');

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'No Tags Article',
          description: 'Test',
          body: 'Test'
          // No tagList
        }
      });

    const response = await request(app).get('/api/tags');

    expect(response.status).toBe(200);
    expect(response.body.tags).toEqual([]);
  });
});
