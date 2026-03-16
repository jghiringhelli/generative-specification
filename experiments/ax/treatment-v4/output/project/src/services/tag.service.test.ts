import { TagService } from './tag.service';
import { ITagRepository, TagEntity } from '../repositories/ITagRepository';

// Mock repository
class MockTagRepository implements ITagRepository {
  private tags: TagEntity[] = [];

  addTag(name: string): void {
    this.tags.push({ id: this.tags.length + 1, name });
  }

  async findByName(name: string): Promise<TagEntity | null> {
    return this.tags.find(t => t.name === name) || null;
  }

  async upsert(name: string): Promise<TagEntity> {
    const existing = this.tags.find(t => t.name === name);
    if (existing) return existing;

    const tag: TagEntity = { id: this.tags.length + 1, name };
    this.tags.push(tag);
    return tag;
  }

  async upsertMany(names: string[]): Promise<TagEntity[]> {
    return Promise.all(names.map(name => this.upsert(name)));
  }

  async listAll(): Promise<string[]> {
    return this.tags.map(t => t.name);
  }
}

describe('TagService', () => {
  let tagService: TagService;
  let mockTagRepo: MockTagRepository;

  beforeEach(() => {
    mockTagRepo = new MockTagRepository();
    tagService = new TagService(mockTagRepo);
  });

  describe('getAllTags', () => {
    it('get_all_tags_with_no_tags_returns_empty_array', async () => {
      const tags = await tagService.getAllTags();

      expect(tags).toEqual([]);
    });

    it('get_all_tags_returns_all_unique_tags', async () => {
      mockTagRepo.addTag('reactjs');
      mockTagRepo.addTag('angular');
      mockTagRepo.addTag('nodejs');

      const tags = await tagService.getAllTags();

      expect(tags).toHaveLength(3);
      expect(tags).toContain('reactjs');
      expect(tags).toContain('angular');
      expect(tags).toContain('nodejs');
    });

    it('get_all_tags_returns_tags_in_database_order', async () => {
      mockTagRepo.addTag('dragons');
      mockTagRepo.addTag('training');
      mockTagRepo.addTag('javascript');

      const tags = await tagService.getAllTags();

      expect(tags).toEqual(['dragons', 'training', 'javascript']);
    });
  });
});
