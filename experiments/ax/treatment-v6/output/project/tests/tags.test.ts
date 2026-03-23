import request from 'supertest';
import express from 'express';
import type { Express } from 'express';
import type { ITagRepository, Tag } from '../src/repositories/ITagRepository.js';
import { TagService } from '../src/services/TagService.js';
import { createTagRouter } from '../src/routes/tag.routes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

// §8 DRY: In-memory tag repository fake — follows established in-memory repository pattern.
class InMemoryTagRepository implements ITagRepository {
  private tagNames: string[] = [];
  private nextId = 1;

  addTag(name: string): void {
    if (!this.tagNames.includes(name)) {
      this.tagNames.push(name);
    }
  }

  async findAll(): Promise<ReadonlyArray<string>> {
    return [...this.tagNames].sort();
  }

  async createIfNotExists(name: string): Promise<Tag> {
    if (!this.tagNames.includes(name)) {
      this.tagNames.push(name);
    }
    return { id: this.nextId++, name };
  }

  async findByNames(names: ReadonlyArray<string>): Promise<Tag[]> {
    return names
      .filter((n) => this.tagNames.includes(n))
      .map((n, i) => ({ id: i + 1, name: n }));
  }

  reset(): void {
    this.tagNames = [];
    this.nextId = 1;
  }
}

function buildTestApp(repo: ITagRepository): Express {
  const app = express();
  app.use(express.json());
  const tagService = new TagService(repo);
  app.use('/api', createTagRouter(tagService));
  app.use(errorHandler);
  return app;
}

describe('Tag endpoints', () => {
  let repo: InMemoryTagRepository;
  let app: Express;

  beforeEach(() => {
    repo = new InMemoryTagRepository();
    app = buildTestApp(repo);
  });

  describe('GET /api/tags', () => {
    it('returns 200 with empty tags array when no tags exist', async () => {
      const res = await request(app).get('/api/tags');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tags');
      expect(Array.isArray(res.body.tags)).toBe(true);
      expect(res.body.tags).toEqual([]);
    });

    it('returns 200 with all tags sorted alphabetically', async () => {
      repo.addTag('dragons');
      repo.addTag('training');
      repo.addTag('animals');

      const res = await request(app).get('/api/tags');

      expect(res.status).toBe(200);
      expect(res.body.tags).toEqual(['animals', 'dragons', 'training']);
    });

    it('returns unique tags only (no duplicates)', async () => {
      repo.addTag('coding');
      repo.addTag('coding'); // duplicate — repository deduplicates

      const res = await request(app).get('/api/tags');

      expect(res.status).toBe(200);
      expect(res.body.tags).toEqual(['coding']);
    });

    it('returns correct response shape with tags array', async () => {
      repo.addTag('test');

      const res = await request(app).get('/api/tags');

      expect(res.status).toBe(200);
      expect(Object.keys(res.body)).toEqual(['tags']);
    });
  });
});
