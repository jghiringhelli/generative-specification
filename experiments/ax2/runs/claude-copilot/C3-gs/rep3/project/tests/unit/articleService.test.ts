import { ArticleService } from '../../src/services/ArticleService';
import {
  InMemoryArticleRepository,
  InMemoryProfileRepository,
  InMemoryUserRepository,
} from '../fixtures/inMemoryRepositories';
import { ForbiddenError, NotFoundError } from '../../src/errors/AppError';

interface Fixture {
  service: ArticleService;
  users: InMemoryUserRepository;
}

async function buildFixture(): Promise<Fixture> {
  const users = new InMemoryUserRepository();
  const follows = new InMemoryProfileRepository();
  const articles = new InMemoryArticleRepository(follows);
  const service = new ArticleService(articles, users, follows);
  return { service, users };
}

async function seedUser(
  users: InMemoryUserRepository,
  username: string,
): Promise<number> {
  const user = await users.create({
    username,
    email: `${username}@example.com`,
    passwordHash: 'hash',
  });
  return user.id;
}

describe('ArticleService', () => {
  it('creates an article and returns the body', async () => {
    const { service, users } = await buildFixture();
    const authorId = await seedUser(users, 'writer');
    const result = await service.create(
      {
        article: {
          title: 'Hello World',
          description: 'desc',
          body: 'the body',
          tagList: ['x'],
        },
      },
      authorId,
    );
    expect(result.article.body).toBe('the body');
    expect(result.article.slug).toContain('hello-world');
  });

  it('omits the body in list responses', async () => {
    const { service, users } = await buildFixture();
    const authorId = await seedUser(users, 'writer2');
    await service.create(
      {
        article: { title: 'T', description: 'd', body: 'b', tagList: [] },
      },
      authorId,
    );
    const list = await service.list(
      { limit: 20, offset: 0 },
      null,
    );
    expect(list.articles[0].body).toBeUndefined();
    expect(list.articlesCount).toBe(1);
  });

  it('throws NotFoundError for a missing slug', async () => {
    const { service } = await buildFixture();
    await expect(service.getBySlug('nope', null)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('forbids a non-author from updating', async () => {
    const { service, users } = await buildFixture();
    const authorId = await seedUser(users, 'owner');
    const otherId = await seedUser(users, 'other');
    const created = await service.create(
      { article: { title: 'Owned', description: 'd', body: 'b', tagList: [] } },
      authorId,
    );
    await expect(
      service.update(
        created.article.slug,
        { article: { title: 'Hacked' } },
        otherId,
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('forbids a non-author from deleting', async () => {
    const { service, users } = await buildFixture();
    const authorId = await seedUser(users, 'owner2');
    const otherId = await seedUser(users, 'other2');
    const created = await service.create(
      { article: { title: 'Owned2', description: 'd', body: 'b', tagList: [] } },
      authorId,
    );
    await expect(
      service.delete(created.article.slug, otherId),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('tracks favorites count', async () => {
    const { service, users } = await buildFixture();
    const authorId = await seedUser(users, 'owner3');
    const fanId = await seedUser(users, 'fan');
    const created = await service.create(
      { article: { title: 'Fav', description: 'd', body: 'b', tagList: [] } },
      authorId,
    );
    const favorited = await service.favorite(created.article.slug, fanId);
    expect(favorited.article.favorited).toBe(true);
    expect(favorited.article.favoritesCount).toBe(1);
  });
});
