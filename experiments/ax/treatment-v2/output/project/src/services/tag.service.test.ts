import { TagService } from './tag.service';
import { TagRepository } from '../repositories/tag.repository';

jest.mock('../repositories/tag.repository');

describe('TagService', () => {
  let tagService: TagService;
  let mockTagRepository: jest.Mocked<TagRepository>;

  beforeEach(() => {
    mockTagRepository = new TagRepository({} as any) as jest.Mocked<TagRepository>;
    tagService = new TagService(mockTagRepository);
  });

  describe('getTags', () => {
    it('getTags_returns_all_tag_names', async () => {
      mockTagRepository.findAll = jest.fn().mockResolvedValue(['reactjs', 'angularjs', 'dragons']);

      const result = await tagService.getTags();

      expect(result.tags).toEqual(['reactjs', 'angularjs', 'dragons']);
      expect(mockTagRepository.findAll).toHaveBeenCalled();
    });

    it('getTags_returns_empty_array_when_no_tags_exist', async () => {
      mockTagRepository.findAll = jest.fn().mockResolvedValue([]);

      const result = await tagService.getTags();

      expect(result.tags).toEqual([]);
    });
  });
});
