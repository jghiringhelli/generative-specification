import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';

describe('Tags Endpoints', () => {
  beforeAll(async () => {
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();

    await prisma.tag.createMany({
      data: [
        { name: 'tag1' },
        { name: 'tag2' },
        { name: 'tag3' }
      ]
    });
  });

  afterAll(async () => {
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.$disconnect();
  });

  it('GET /api/tags - should return all tags', async () => {
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body.tags).toBeDefined();
    expect(res.body.tags).toContain('tag1');
    expect(res.body.tags).toContain('tag2');
    expect(res.body.tags).toContain('tag3');
  });
});
