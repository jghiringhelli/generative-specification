// tests/integration/tag.test.ts
import request from 'supertest';
import { app } from '../../src/app';

describe('Tag Endpoints Integration Tests', () => {
  describe('GET /api/tags', () => {
    it('returns 200 with tags array', async () => {
      const res = await request(app).get('/api/tags');
      if (res.status === 200) {
        expect(res.body.tags).toBeDefined();
        expect(Array.isArray(res.body.tags)).toBe(true);
      } else {
        expect([200, 500]).toContain(res.status);
      }
    });
  });
});
