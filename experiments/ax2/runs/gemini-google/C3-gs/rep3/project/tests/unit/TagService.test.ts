// tests/unit/TagService.test.ts
import { TagService } from '../../src/services/TagService';
import { ITagRepository } from '../../src/repositories/ITagRepository';

class MockTagRepository implements ITagRepository {
  public tags: string[] = ['react', 'typescript', 'express'];

  public async findAll(): Promise<string[]> {
    return this.tags;
  }

  public async findOrCreateMany(tags: string[]): Promise<string[]> {
    for (const t of tags) {
      if (!this.tags.includes(t)) {
        this.tags.push(t);
      }
    }
    return tags;
  }
}

describe('TagService', () => {
  let tagRepository: MockTagRepository;
  let tagService: TagService;

  beforeEach(() => {
    tagRepository = new MockTagRepository();
    tagService = new TagService(tagRepository);
  });

  describe('getTags', () => {
    it('returns list of unique tags', async () => {
      const tags = await tagService.getTags();
      expect(tags).toEqual(['react', 'typescript', 'express']);
    });

    it('returns empty list when no tags exist', async () => {
      tagRepository.tags = [];
      const tags = await tagService.getTags();
      expect(tags).toEqual([]);
    });
  });
});
