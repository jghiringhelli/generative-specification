import { TagService } from '../../src/services/TagService';
import { InMemoryTagRepository } from '../../src/repositories/in-memory/InMemoryTagRepository';
import { InMemoryArticleRepository } from '../../src/repositories/in-memory/InMemoryArticleRepository';
import { InMemoryUserRepository } from '../../src/repositories/in-memory/InMemoryUserRepository';
import { InMemoryProfileRepository } from '../../src/repositories/in-memory/InMemoryProfileRepository';

describe('TagService Unit Tests', () => {
  let tagService: TagService;
  let articleRepository: InMemoryArticleRepository;

  beforeEach(async () => {
    const userRepository = new InMemoryUserRepository();
    const profileRepository = new InMemoryProfileRepository(userRepository);
    articleRepository = new InMemoryArticleRepository(userRepository, profileRepository);
    const tagRepository = new InMemoryTagRepository(articleRepository);
    tagService = new TagService(tagRepository);

    const user = await userRepository.create({
      username: 'tagauthor',
      email: 'tag@example.com',
      passwordHash: 'hash',
    });

    await articleRepository.create({
      title: 'Article One',
      description: 'desc',
      body: 'body',
      tagList: ['typescript', 'react'],
      authorId: user.id,
    });

    await articleRepository.create({
      title: 'Article Two',
      description: 'desc',
      body: 'body',
      tagList: ['react', 'nodejs'],
      authorId: user.id,
    });
  });

  it('should return all unique tags that appear on any article', async () => {
    const result = await tagService.getTags();

    expect(result.tags).toHaveLength(3);
    expect(result.tags).toContain('typescript');
    expect(result.tags).toContain('react');
    expect(result.tags).toContain('nodejs');
  });
});
