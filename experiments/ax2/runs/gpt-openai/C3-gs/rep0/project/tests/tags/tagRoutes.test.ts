import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../src/http/errorHandler';
import { ITagRepository } from '../../src/repositories/ITagRepository';
import { TagService } from '../../src/tags/TagService';
import { createTagRouter } from '../../src/tags/tagRoutes';

test('GET /api/tags returns unique article tags', async () => {
  const repository: jest.Mocked<ITagRepository> = { listUnique: jest.fn() };
  repository.listUnique.mockResolvedValue(['javascript', 'typescript']);
  const app = express().use('/api/tags', createTagRouter(new TagService(repository))).use(errorHandler);
  await request(app).get('/api/tags').expect(200).expect({
    tags: ['javascript', 'typescript'],
  });
});
