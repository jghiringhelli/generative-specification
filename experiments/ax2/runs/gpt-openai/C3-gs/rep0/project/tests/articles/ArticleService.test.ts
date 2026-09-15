import { ArticleService } from '../../src/articles/ArticleService';
import { IArticleRepository, ArticleRecord } from '../../src/repositories/IArticleRepository';
import { IProfileRepository } from '../../src/repositories/IProfileRepository';
import { IUserRepository, UserRecord } from '../../src/repositories/IUserRepository';

const author: UserRecord = {
  id: 'author-id', email: 'author@example.com', username: 'author',
  passwordHash: 'hash', bio: null, image: null,
};
const article: ArticleRecord = {
  id: 'article-id', slug: 'hello', title: 'Hello', description: 'Description',
  body: 'Secret list body', tagList: ['typescript'], authorId: author.id,
  createdAt: new Date(), updatedAt: new Date(),
};

function dependencies() {
  const articles: jest.Mocked<IArticleRepository> = {
    list: jest.fn(), findBySlug: jest.fn(), create: jest.fn(), update: jest.fn(),
    delete: jest.fn(), favorite: jest.fn(), unfavorite: jest.fn(),
    isFavorited: jest.fn(), favoriteCount: jest.fn(),
  };
  const users: jest.Mocked<IUserRepository> = {
    findById: jest.fn(), findByEmail: jest.fn(), findByUsername: jest.fn(),
    create: jest.fn(), update: jest.fn(),
  };
  const profiles: jest.Mocked<IProfileRepository> = {
    findByUsername: jest.fn(), isFollowing: jest.fn(),
    follow: jest.fn(), unfollow: jest.fn(),
  };
  users.findById.mockResolvedValue(author);
  articles.favoriteCount.mockResolvedValue(0);
  profiles.isFollowing.mockResolvedValue(false);
  return { articles, users, profiles };
}

describe('ArticleService', () => {
  test('omits body from list responses', async () => {
    const deps = dependencies();
    deps.articles.list.mockResolvedValue({ articles: [article], count: 1 });
    const service = new ArticleService(deps.articles, deps.users, deps.profiles);
    const result = await service.list({ limit: 20, offset: 0 });
    expect(result.articles[0]).not.toHaveProperty('body');
    expect(result.articlesCount).toBe(1);
  });

  test('rejects update by a non-author', async () => {
    const deps = dependencies();
    deps.articles.findBySlug.mockResolvedValue(article);
    const service = new ArticleService(deps.articles, deps.users, deps.profiles);
    await expect(service.update('hello', 'other-id', { title: 'Changed' }))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  test('returns 404 for an unknown article', async () => {
    const deps = dependencies();
    deps.articles.findBySlug.mockResolvedValue(null);
    const service = new ArticleService(deps.articles, deps.users, deps.profiles);
    await expect(service.get('missing')).rejects.toMatchObject({ statusCode: 404 });
  });
});
