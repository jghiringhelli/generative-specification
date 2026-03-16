import { TagService } from './TagService';
import { ITagRepository } from '../repositories/ITagRepository';

/**
 * Mock implementation of ITagRepository for unit tests.
 */
class MockTagRepository implements ITagRepository {
  private tags: string[] = [];

  async getAllTags(): Promise<string[]> {
    return [...this.tags].sort();
  }

  addTags(...tags: string[]): void {
    this.tags.push(...tags);
  }

  reset(): void {
    this.tags = [];
  }
}

describe('TagService', () => {
  let repository: MockTagRepository;
  let service: TagService;

  beforeEach(() => {
    repository = new MockTagRepository();
    service = new TagService(repository);
  });

  describe('getAllTags', () => {
    it('get_all_tags_returns_array_of_tag_names', async () => {
      repository.addTags('reactjs', 'angularjs', 'dragons');

      const tags = await service.getAllTags();

      expect(tags).toEqual(['angularjs', 'dragons', 'reactjs']);
    });

    it('get_all_tags_with_no_tags_returns_empty_array', async () => {
      const tags = await service.getAllTags();

      expect(tags).toEqual([]);
    });

    it('get_all_tags_returns_unique_tags_sorted', async () => {
      repository.addTags('zebra', 'apple', 'banana');

      const tags = await service.getAllTags();

      expect(tags).toEqual(['apple', 'banana', 'zebra']);
    });
  });
});
