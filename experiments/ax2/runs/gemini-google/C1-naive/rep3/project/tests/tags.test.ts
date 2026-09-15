import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';

jest.mock('../src/prisma', () => ({
  __esModule: true,
  default: {
    tag: {
      findMany: jest.fn()
    }
  }
}));

describe('Tags Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tags', () => {
    it('should return list of tags', async () => {
      (prisma.tag.findMany as jest.Mock).mockResolvedValue([
        { name: 'typescript' },
        { name: 'react' },
        { name: 'nodejs' }
      ]);

      const res = await request(app).get('/api/tags');
      expect(res.status).toBe(200);
      expect(res.body.tags).toEqual(['typescript', 'react', 'nodejs']);
    });

    it('should return empty list when no tags exist', async () => {
      (prisma.tag.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app).get('/api/tags');
      expect(res.status).toBe(200);
      expect(res.body.tags).toEqual([]);
    });
  });
});
