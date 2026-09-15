import { TagService } from '../../src/services/tag.service';
import { ITagRepository } from '../../src/repositories/tag.repository';

describe('TagService (unit)', () => {
  let mockTagRepository: jest.Mocked<ITagRepository>;
  let tagService: TagService;

  beforeEach(() => {
    mockTagRepository = {
      findAllTags: jest.fn()
    };
    tagService = new TagService(mockTagRepository);
  });

  describe('getTags', () => {
    it('returns empty array when no tags are found in repository', async () => {
      mockTagRepository.findAllTags.mockResolvedValue([]);

      const result = await tagService.getTags();

      expect(result.tags).toEqual([]);
    });

    it('returns array of tag strings retrieved from repository', async () => {
      mockTagRepository.findAllTags.mockResolvedValue(['react', 'typescript']);

      const result = await tagService.getTags();

      expect(result.tags).toEqual(['react', 'typescript']);
    });
  });
});
