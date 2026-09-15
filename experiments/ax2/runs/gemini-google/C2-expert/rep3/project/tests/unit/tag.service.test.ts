import { TagRepository } from '../../src/repositories/tag.repository';
import { TagService } from '../../src/services/tag.service';

describe('TagService Unit Tests', () => {
  let mockTagRepo: jest.Mocked<TagRepository>;
  let tagService: TagService;

  beforeEach(() => {
    mockTagRepo = {
      findAllTags: jest.fn(),
    } as unknown as jest.Mocked<TagRepository>;

    tagService = new TagService(mockTagRepo);
  });

  it('returns all unique tag strings from tag repository', async () => {
    mockTagRepo.findAllTags.mockResolvedValue(['angular', 'react', 'vue']);

    const result = await tagService.getAllTags();

    expect(result).toEqual(['angular', 'react', 'vue']);
    expect(mockTagRepo.findAllTags).toHaveBeenCalledTimes(1);
  });
});
