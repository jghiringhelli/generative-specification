import { ArticleService } from '../../src/services/ArticleService';
import { ForbiddenError, NotFoundError } from '../../src/errors/AppError';
import { InMemoryStore, InMemoryProfileRepository, InMemoryUserRepository } from '../helpers/userFakes';
import { InMemoryArticleRepository } from '../helpers/articleFakes';

/**
 * Build an ArticleService with in-memory repositories and one seeded author.
 * @returns The service, store, and author id.
 */
async function buildService(): Promise<{
  service: ArticleService;
  store: InMemoryStore;
  authorId: number;
}> {
  const store = new InMemoryStore();
  const author = await new InMemoryUserRepository(store).create({
    email: 'author@example.com',
    username: 'author',
    passwordHash: 'hash',
  });
  const service = new ArticleService(
    new InMemoryArticleRepository(store),
    new InMemoryProfileRepository(store),
  );
  return { service, store, authorId: author.id };
}

const articleInput = {
  article: {
    title: 'Hello World',
    description: 'A greeting',
    body: 'The body',
    tagList: ['intro', 'greeting'],
  },
};

describe('ArticleService.create', () => {
  it('creates an article with a generated slug and sorted tags', async () => {
    const { service, authorId } = await buildService();
    const view = await service.create(authorId, articleInput);
    expect(view.slug).toContain('hello-world');
    expect(view.tagList).toEqual(['greeting', 'intro']);
    expect(view.body).toBe('The body');
  });
});

describe('ArticleService.list', () => {
  it('omits the body field from list responses', async () => {
    const { service, authorId } = await buildService();
    await service.create(authorId, articleInput);
    const result = await service.list({ limit: 20, offset: 0 });
    expect(result.articlesCount).toBe(1);
    expect(result.articles[0].body).toBeUndefined();
  });

  it('filters by tag', async () => {
    const { service, authorId } = await buildService();
    await service.create(authorId, articleInput);
    await service.create(authorId, {
      article: { title: 'Other', description: 'd', body: 'b', tagList: ['unrelated'] },
    });
    const result = await service.list({ tag: 'intro', limit: 20, offset: 0 });
    expect(result.articlesCount).toBe(1);
  });

  it('paginates with limit and offset', async () => {
    const { service, authorId } = await buildService();
    await service.create(authorId, articleInput);
    await service.create(authorId, {
      article: { title: 'Second', description: 'd', body: 'b', tagList: [] },
    });
    const page = await service.list({ limit: 1, offset: 1 });
    expect(page.articles).toHaveLength(1);
    expect(page.articlesCount).toBe(2);
  });
});

describe('ArticleService.update', () => {
  it('forbids updating an article the caller does not own', async () => {
    const { service, store, authorId } = await buildService();
    const created = await service.create(authorId, articleInput);
    const other = await new InMemoryUserRepository(store).create({
      email: 'other@example.com',
      username: 'other',
      passwordHash: 'hash',
    });
    await expect(
      service.update(created.slug, other.id, { article: { title: 'Nope' } }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('ArticleService.get', () => {
  it('throws NotFoundError for an unknown slug', async () => {
    const { service } = await buildService();
    await expect(service.get('missing')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('ArticleService.favorite', () => {
  it('increments the favorites count', async () => {
    const { service, authorId } = await buildService();
    const created = await service.create(authorId, articleInput);
    const favorited = await service.favorite(created.slug, authorId);
    expect(favorited.favorited).toBe(true);
    expect(favorited.favoritesCount).toBe(1);
    const unfavorited = await service.unfavorite(created.slug, authorId);
    expect(unfavorited.favorited).toBe(false);
    expect(unfavorited.favoritesCount).toBe(0);
  });
});
