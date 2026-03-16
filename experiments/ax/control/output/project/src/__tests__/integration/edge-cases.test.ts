import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../index';

const prisma = new PrismaClient();

describe('Edge Cases & Boundary Conditions', () => {
  let userToken: string;

  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();

    const userResponse = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        }
      });

    userToken = userResponse.body.user.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Article slug edge cases', () => {
    it('handles title with only special characters', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: '@#$%^&*()',
            description: 'Special chars',
            body: 'Body'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.article.slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('handles very long title', async () => {
      const longTitle = 'A'.repeat(200);
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: longTitle,
            description: 'Description',
            body: 'Body'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.article.slug).toBeDefined();
    });

    it('handles title with multiple consecutive spaces', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Title    With    Many    Spaces',
            description: 'Description',
            body: 'Body'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.article.slug).not.toContain('  ');
    });

    it('handles title with leading and trailing spaces', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: '   Trimmed Title   ',
            description: 'Description',
            body: 'Body'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.article.slug).toMatch(/^trimmed-title-[a-z0-9]+$/);
    });
  });

  describe('Tag edge cases', () => {
    it('handles articles with many tags', async () => {
      const manyTags = Array.from({ length: 20 }, (_, i) => `tag${i}`);
      
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article with many tags',
            description: 'Description',
            body: 'Body',
            tagList: manyTags
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.article.tagList).toHaveLength(20);
    });

    it('handles duplicate tags in tagList', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article with duplicate tags',
            description: 'Description',
            body: 'Body',
            tagList: ['react', 'react', 'javascript']
          }
        });

      expect(response.status).toBe(201);
      // Tag list may or may not dedupe - behavior depends on implementation
      expect(response.body.article.tagList).toContain('react');
      expect(response.body.article.tagList).toContain('javascript');
    });

    it('handles empty string tags', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article',
            description: 'Description',
            body: 'Body',
            tagList: ['', 'valid-tag', '']
          }
        });

      expect(response.status).toBe(201);
    });
  });

  describe('User profile edge cases', () => {
    it('handles very long bio', async () => {
      const longBio = 'A'.repeat(5000);
      
      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${userToken}`)
        .send({
          user: {
            bio: longBio
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user.bio).toHaveLength(5000);
    });

    it('handles bio with special characters', async () => {
      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${userToken}`)
        .send({
          user: {
            bio: '¡Hola! 你好 🎉 <script>alert("xss")</script>'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user.bio).toContain('¡Hola!');
    });

    it('allows setting bio to null', async () => {
      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${userToken}`)
        .send({
          user: {
            bio: null
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user.bio).toBeNull();
    });
  });

  describe('Comment edge cases', () => {
    let articleSlug: string;

    beforeEach(async () => {
      const articleResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Test Article',
            description: 'Description',
            body: 'Body'
          }
        });

      articleSlug = articleResponse.body.article.slug;
    });

    it('handles very long comment body', async () => {
      const longComment = 'A'.repeat(10000);
      
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${userToken}`)
        .send({
          comment: {
            body: longComment
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.comment.body).toHaveLength(10000);
    });

    it('handles comment with special characters', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${userToken}`)
        .send({
          comment: {
            body: '¡Great article! 👍 <script>alert("xss")</script>'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.comment.body).toContain('¡Great article!');
    });
  });

  describe('Authentication edge cases', () => {
    it('handles malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
    });

    it('handles Bearer token instead of Token', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(401);
    });

    it('handles empty token after Token prefix', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', 'Token ');

      expect(response.status).toBe(401);
    });

    it('handles expired token gracefully', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
      
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Token ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });
});
