import { ArticleService } from '../../src/services/ArticleService';
import { InMemoryUserRepository } from '../helpers/InMemoryUserRepository';
import { InMemoryProfileRepository } from '../helpers/InMemoryProfileRepository';
import { InMemoryArticleRepository } from '../helpers/InMemoryArticleRepository';
import { ForbiddenError, NotFoundError, ValidationError } from '../../src/errors/AppError';
import { UserEntity } from '../../src/domain/types';

/**
 * Build an ArticleService with in-memory dependencies and a seeded author.
 */
async function build(): Promise<{
  service: ArticleService;
  users: InMemoryUserRepository;
  author: UserEntity;
}> {
  const users = new InMemoryUserRepository();
  const profiles = new InMemoryProfileRepository();
  const articles = new InMemoryArticleRepository(users);
  const service = new ArticleService(articles, users, profiles);
  const author = await users.create({
    email: 'author@example.com',
    username: 'author',
    passwordHash: 'x'
  });
  return { service, users, author };
}

const validArticle = {
  article: { title: 'My Post', description: 'desc', body: 'body', tagList: ['t'] }
};

describe('ArticleService.create', () => {
  it('creates an article with a generated slug', async () => {
    const { service, author } = await build();
    const result = await service.create(validArticle, author);
    expect(result.article.slug).toBe('my-post');
    expect(result.article.body).toBe('body');
    expect(result.article.author.username).toBe('author');
  });

  it('generates unique slugs for duplicate titles', async () => {
    const { service, author } = await build();
    const first = await service.create(validArticle, author);
    const second = await service.create(validArticle, author);
    expect(second.article.slug).not.toBe(first.article.slug);
  });

  it('rejects invalid input', async () => {
    const { service, author } = await build();
    await expect(
      service.create({ article: { title: 'x' } }, author)
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('ArticleService.getBySlug', () => {
  it('throws NotFoundError for an unknown slug', async () => {
    const { service } = await build();
    await expect(service.getBySlug('nope', undefined)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('includes the body for a single article', async () => {
    const { service, author } = await build();
    const created = await service.create(validArticle, author);
    const result = await service.getBySlug(created.article.slug, author.id);
    expect(result.article.body).toBe('body');
  });
});

describe('ArticleService.list', () => {
  it('excludes the body field', async () => {
    const { service, author } = await build();
    await service.create(validArticle, author);
    const result = await service.list({}, undefined);
    expect(result.articlesCount).toBe(1);
    expect(result.articles[0].body).toBeUndefined();
  });
});

describe('ArticleService.update', () => {
  it('rejects updates from a non-author', async () => {
    const { service, users, author } = await build();
    const created = await service.create(validArticle, author);
    const other = await users.create({
      email: 'other@example.com',
      username: 'other',
      passwordHash: 'x'
    });
    await expect(
      service.update(created.article.slug, { article: { title: 'New' } }, other)
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('ArticleService.delete', () => {
  it('rejects deletion from a non-author', async () => {
    const { service, users, author } = await build();
    const created = await service.create(validArticle, author);
    const other = await users.create({
      email: 'other@example.com',
      username: 'other',
      passwordHash: 'x'
    });
    await expect(
      service.delete(created.article.slug, other)
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('ArticleService.favorite', () => {
  it('marks favorited and increments the count', async () => {
    const { service, users, author } = await build();
    const created = await service.create(validArticle, author);
    const fan = await users.create({
      email: 'fan@example.com',
      username: 'fan',
      passwordHash: 'x'
    });
    const favorited = await service.favorite(created.article.slug, fan.id);
    expect(favorited.article.favorited).toBe(true);
    expect(favorited.article.favoritesCount).toBe(1);
    const unfavorited = await service.unfavorite(created.article.slug, fan.id);
    expect(unfavorited.article.favorited).toBe(false);
    expect(unfavorited.article.favoritesCount).toBe(0);
  });
});
