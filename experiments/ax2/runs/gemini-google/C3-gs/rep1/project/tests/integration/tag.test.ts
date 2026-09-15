import request from 'supertest';
import { createApp } from '../../src/app';
import { ITagRepository } from '../../src/repositories/ITagRepository';

class FakeTagRepository implements ITagRepository {
  async findAll(): Promise<string[]> {
    return ['community', 'programming', 'typescript'];
  }
}

describe('Tag Endpoints (Integration)', () => {
  let app: any;

  beforeEach(() => {
    app = createApp({
      tagRepository: new FakeTagRepository(),
    });
  });

  describe('GET /api/tags', () => {
    it('returns list of unique tags', async () => {
      const res = await request(app).get('/api/tags');

      expect(res.status).toBe(200);
      expect(res.body.tags).toBeDefined();
      expect(Array.isArray(res.body.tags)).toBe(true);
      expect(res.body.tags).toEqual(['community', 'programming', 'typescript']);
    });
  });
});
