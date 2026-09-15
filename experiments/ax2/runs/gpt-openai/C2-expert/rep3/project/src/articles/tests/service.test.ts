import type { ArticleRepository, ArticleRecord } from '../repository';
import { ArticleService } from '../service';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const record: ArticleRecord = {
  id: 1, slug: 'hello-world-1000', title: 'Hello World', description: 'Description', body: 'Body',
  authorId: 7, createdAt, updatedAt: createdAt,
  author: { id: 7, email: 'alice@example.com', username: 'alice', password: 'hash', bio: null, image: null, createdAt, updatedAt: createdAt, followers: [] },
  tags: [{ articleId: 1, tagId: 1, tag: { id: 1, name: 'api' } }],
  favorites: [],
};

function repository(overrides: Partial<ArticleRepository> = {}): ArticleRepository {
  return {
    list: jest.fn().mockResolvedValue({ records: [record], count: 1 }),
    feed: jest.fn().mockResolvedValue({ records: [], count: 0 }),
    findBySlug: jest.fn().mockResolvedValue(record),
    create: jest.fn().mockResolvedValue(record),
    update: jest.fn().mockResolvedValue(record),
    delete: jest.fn().mockResolvedValue(undefined),
    favorite: jest.fn().mockResolvedValue(undefined),
    unfavorite: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as ArticleRepository;
}

describe('ArticleService', () => {
  it('creates a kebab-case slug with a timestamp suffix', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    const articles = repository();
    const service = new ArticleService(articles);
    await service.create(7, { title: 'Hello, World!', description: 'Description', body: 'Body', tagList: ['api'] });
    expect(articles.create).toHaveBeenCalledWith(7, 'hello-world-1000', expect.any(Object));
    jest.restoreAllMocks();
  });

  it('omits article bodies from list responses', async () => {
    const response = await new ArticleService(repository()).list({ limit: 20, offset: 0 });
    expect(response.articles[0]).not.toHaveProperty('body');
    expect(response.articlesCount).toBe(1);
  });
});

