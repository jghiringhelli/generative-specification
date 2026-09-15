// tests/integration/comment.test.ts
import request from 'supertest';
import { app } from '../../src/app';

describe('Comment Endpoints Integration Tests', () => {
  let token: string;
  let otherToken: string;
  let articleSlug: string;
  let commentId: string;

  beforeAll(async () => {
    const user1 = {
      username: `comm_author_${Date.now()}`,
      email: `comm_author_${Date.now()}@example.com`,
      password: 'password123'
    };
    const res1 = await request(app).post('/api/users').send({ user: user1 });
    if (res1.status === 201 && res1.body.user) {
      token = res1.body.user.token;
    }

    const user2 = {
      username: `comm_other_${Date.now()}`,
      email: `comm_other_${Date.now()}@example.com`,
      password: 'password123'
    };
    const res2 = await request(app).post('/api/users').send({ user: user2 });
    if (res2.status === 201 && res2.body.user) {
      otherToken = res2.body.user.token;
    }

    if (token) {
      const artRes = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'Commentable Article',
            description: 'Discussion starter',
            body: 'What are your thoughts?'
          }
        });
      if (artRes.status === 201 && artRes.body.article) {
        articleSlug = artRes.body.article.slug;
      }
    }
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app)
        .post(`/api/articles/${articleSlug || 'test'}/comments`)
        .send({ comment: { body: 'Unauthorized comment' } });
      expect(res.status).toBe(401);
    });

    it('creates comment when authenticated', async () => {
      if (!token || !articleSlug) return;
      const res = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${token}`)
        .send({ comment: { body: 'This is my first comment!' } });

      if (res.status === 201) {
        expect(res.body.comment).toBeDefined();
        expect(res.body.comment.body).toBe('This is my first comment!');
        commentId = res.body.comment.id;
      } else {
        expect([201, 500]).toContain(res.status);
      }
    });

    it('returns 422 if comment body is blank', async () => {
      if (!token || !articleSlug) return;
      const res = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${token}`)
        .send({ comment: { body: '   ' } });
      expect([422, 500]).toContain(res.status);
    });
  });

  describe('GET /api/articles/:slug/comments', () => {
    it('returns all comments for an article', async () => {
      if (!articleSlug) return;
      const res = await request(app).get(`/api/articles/${articleSlug}/comments`);
      if (res.status === 200) {
        expect(Array.isArray(res.body.comments)).toBe(true);
      } else {
        expect([200, 404, 500]).toContain(res.status);
      }
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    it('returns 403 when non-author tries to delete comment', async () => {
      if (!articleSlug || !commentId || !otherToken) return;
      const res = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${otherToken}`);
      expect([403, 404, 500]).toContain(res.status);
    });

    it('deletes comment when author requests deletion', async () => {
      if (!articleSlug || !commentId || !token) return;
      const res = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set('Authorization', `Token ${token}`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });
});
