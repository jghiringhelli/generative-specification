import { TagService } from '../../src/services/TagService';
import { ITagRepository } from '../../src/repositories/ITagRepository';

class FakeTagRepository implements ITagRepository {
  private tags: string[] = ['typescript', 'react', 'nodejs'];

  async findAll(): Promise<string[]> {
    return [...this.tags];
  }
}

describe('TagService Unit Tests', () => {
  it('returns all tags from the repository', async () => {
    const fakeRepo = new FakeTagRepository();
    const tagService = new TagService(fakeRepo);

    const tags = await tagService.getTags();
    expect(tags).toEqual(['typescript', 'react', 'nodejs']);
  });
});
