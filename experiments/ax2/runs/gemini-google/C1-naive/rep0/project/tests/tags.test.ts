import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/prisma';

jest.mock('../src/prisma', () => ({
  prisma: {
    tag: {
      findMany: jest.fn()
    }
  }
}));

describe('Tag Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tags', () => {
    it('should return list of tags', async () => {
      (prisma.tag.findMany as jest.Mock).mockResolvedValue([
        { name: 'angularjs' },
        { name: 'reactjs' }
      ]);

      const res = await request(app).get('/api/tags');
      expect(res.status).toBe(200);
      expect(res.body.tags).toEqual(['angularjs', 'reactjs']);
    });
  });
});
