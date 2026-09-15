import { ArticleService } from '../../src/services/ArticleService';
import {
  InMemoryArticleRepository,
  InMemoryProfileRepository,
  InMemoryStore,
  InMemoryUserRepository,
} from '../helpers/inMemory';
import { ForbiddenError, NotFoundError } from '../../src/errors/AppError';

async function seed() {
  const store = new InMemoryStore();
  const users = new InMemoryUserRepository(store);
  const author = await users.create({ email: 'a@e.com', username: 'author', passwordHash: 'h' });
  const other = await users.create({ email: 'o@e.com', username: 'other', passwordHash: 'h' });
  const service = new ArticleService(
    new InMemoryArticleRepository(store),
    new InMemoryProfileRepository(store),
  );
  return { service, author, other };
}

const input = { title: 'Hello World', description: 'desc', body: 'body', tagList: ['a', 'b'] };

describe('ArticleService', () => {
  it('creates an article with a slug derived from the title', async () => {
    const { service, author } = await seed();
    const article = await service.createArticle(author.id, input);
    expect(article.slug).toContain('hello-world');
    expect(article.tagList.sort()).toEqual(['a', 'b']);
    expect(article.body).toBe('body');
  });

  it('getArticle throws NotFoundError for unknown slug', async () => {
    const { service } = await seed();
    await expect(service.getArticle('nope', null)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('updateArticle rejects non-authors with ForbiddenError', async () => {
    const { service, author, other } = await seed();
    const created = await service.createArticle(author.id, input);
    await expect(
      service.updateArticle(created.slug, other.id, { title: 'x' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('updateArticle changes the slug when the title changes', async () => {
    const { service, author } = await seed();
    const created = await service.createArticle(author.id, input);
    const updated = await service.updateArticle(created.slug, author.id, { title: 'New Name' });
    expect(updated.slug).toContain('new-name');
    expect(updated.title).toBe('New Name');
  });

  it('deleteArticle rejects non-authors', async () => {
    const { service, author, other } = await seed();
    const created = await service.createArticle(author.id, input);
    await expect(service.deleteArticle(created.slug, other.id)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('favorite increments count and sets favorited', async () => {
    const { service, author, other } = await seed();
    const created = await service.createArticle(author.id, input);
    const favorited = await service.favorite(created.slug, other.id);
    expect(favorited.favorited).toBe(true);
    expect(favorited.favoritesCount).toBe(1);
  });

  it('unfavorite decrements count and clears favorited', async () => {
    const { service, author, other } = await seed();
    const created = await service.createArticle(author.id, input);
    await service.favorite(created.slug, other.id);
    const unfavorited = await service.unfavorite(created.slug, other.id);
    expect(unfavorited.favorited).toBe(false);
    expect(unfavorited.favoritesCount).toBe(0);
  });

  it('list omits the body field', async () => {
    const { service, author } = await seed();
    await service.createArticle(author.id, input);
    const result = await service.listArticles({ limit: 20, offset: 0 }, null);
    expect(result.articlesCount).toBe(1);
    expect(result.articles[0].body).toBeUndefined();
  });

  it('feed returns only followed authors', async () => {
    const store = new InMemoryStore();
    const users = new InMemoryUserRepository(store);
    const profiles = new InMemoryProfileRepository(store);
    const articles = new InMemoryArticleRepository(store);
    const author = await users.create({ email: 'a@e.com', username: 'author', passwordHash: 'h' });
    const reader = await users.create({ email: 'r@e.com', username: 'reader', passwordHash: 'h' });
    const service = new ArticleService(articles, profiles);
    await service.createArticle(author.id, input);
    await profiles.follow(reader.id, author.id);
    const feed = await service.feed(reader.id, { limit: 20, offset: 0 });
    expect(feed.articlesCount).toBe(1);
    expect(feed.articles[0].body).toBeUndefined();
  });
});
