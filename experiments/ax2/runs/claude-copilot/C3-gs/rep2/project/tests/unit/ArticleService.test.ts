import { ArticleService } from '../../src/services/ArticleService';
import { ProfileService } from '../../src/services/ProfileService';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';
import { InMemoryProfileRepository } from '../fakes/InMemoryProfileRepository';
import { InMemoryArticleRepository } from '../fakes/InMemoryArticleRepository';
import { ForbiddenError, NotFoundError } from '../../src/errors/AppError';

/** Wire an ArticleService with fakes and two users. */
async function setup() {
  const users = new InMemoryUserRepository();
  const profiles = new InMemoryProfileRepository();
  const articles = new InMemoryArticleRepository(users, profiles);
  const profileService = new ProfileService(users, profiles);
  const service = new ArticleService(articles, users, profileService);
  const author = await users.create({
    email: 'author@example.com',
    username: 'author',
    passwordHash: 'h',
  });
  const other = await users.create({
    email: 'other@example.com',
    username: 'other',
    passwordHash: 'h',
  });
  return { service, articles, profiles, authorId: author.id, otherId: other.id };
}

describe('ArticleService', () => {
  it('creates an article with a slug and returns the body', async () => {
    const { service, authorId } = await setup();
    const article = await service.create(authorId, {
      title: 'Hello World',
      description: 'desc',
      body: 'the body',
      tagList: ['a', 'b'],
    });
    expect(article.slug).toContain('hello-world');
    expect(article.body).toBe('the body');
    expect(article.tagList).toEqual(['a', 'b']);
    expect(article.author.username).toBe('author');
  });

  it('omits the body in list responses', async () => {
    const { service, authorId } = await setup();
    await service.create(authorId, { title: 'A', description: 'd', body: 'b' });
    const list = await service.list({ limit: 20, offset: 0 });
    expect(list.articlesCount).toBe(1);
    expect(list.articles[0].body).toBeUndefined();
  });

  it('filters list by tag', async () => {
    const { service, authorId } = await setup();
    await service.create(authorId, { title: 'A', description: 'd', body: 'b', tagList: ['x'] });
    await service.create(authorId, { title: 'B', description: 'd', body: 'b', tagList: ['y'] });
    const list = await service.list({ tag: 'x', limit: 20, offset: 0 });
    expect(list.articlesCount).toBe(1);
    expect(list.articles[0].tagList).toContain('x');
  });

  it('paginates the list', async () => {
    const { service, authorId } = await setup();
    for (let i = 0; i < 3; i++) {
      await service.create(authorId, { title: `T${i}`, description: 'd', body: 'b' });
    }
    const page = await service.list({ limit: 2, offset: 0 });
    expect(page.articles).toHaveLength(2);
    expect(page.articlesCount).toBe(3);
  });

  it('returns only followed authors in the feed', async () => {
    const { service, profiles, authorId, otherId } = await setup();
    await service.create(authorId, { title: 'By author', description: 'd', body: 'b' });
    await service.create(otherId, { title: 'By other', description: 'd', body: 'b' });
    await profiles.follow(otherId, authorId);

    const feed = await service.feed(otherId, { limit: 20, offset: 0 });
    expect(feed.articlesCount).toBe(1);
    expect(feed.articles[0].title).toBe('By author');
  });

  it('forbids updating an article by a non-author', async () => {
    const { service, authorId, otherId } = await setup();
    const article = await service.create(authorId, {
      title: 'Owned',
      description: 'd',
      body: 'b',
    });
    await expect(
      service.update(article.slug, otherId, { title: 'Hacked' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('forbids deleting an article by a non-author', async () => {
    const { service, authorId, otherId } = await setup();
    const article = await service.create(authorId, { title: 'Owned', description: 'd', body: 'b' });
    await expect(service.delete(article.slug, otherId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws NotFoundError for an unknown slug', async () => {
    const { service } = await setup();
    await expect(service.getBySlug('nope')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('favorites and unfavorites an article, tracking the count', async () => {
    const { service, authorId, otherId } = await setup();
    const article = await service.create(authorId, { title: 'Fav', description: 'd', body: 'b' });

    const favorited = await service.favorite(article.slug, otherId);
    expect(favorited.favorited).toBe(true);
    expect(favorited.favoritesCount).toBe(1);

    const unfavorited = await service.unfavorite(article.slug, otherId);
    expect(unfavorited.favorited).toBe(false);
    expect(unfavorited.favoritesCount).toBe(0);
  });
});
