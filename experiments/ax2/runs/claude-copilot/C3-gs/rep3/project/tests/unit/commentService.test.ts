import { CommentService } from '../../src/services/CommentService';
import {
  InMemoryArticleRepository,
  InMemoryCommentRepository,
  InMemoryProfileRepository,
  InMemoryUserRepository,
} from '../fixtures/inMemoryRepositories';
import { ForbiddenError, NotFoundError } from '../../src/errors/AppError';

async function build() {
  const users = new InMemoryUserRepository();
  const follows = new InMemoryProfileRepository();
  const articles = new InMemoryArticleRepository(follows);
  const comments = new InMemoryCommentRepository();
  const service = new CommentService(comments, articles, users, follows);
  return { service, users, articles };
}

async function seedArticle(
  users: InMemoryUserRepository,
  articles: InMemoryArticleRepository,
  username: string,
): Promise<{ slug: string; authorId: number }> {
  const author = await users.create({
    username,
    email: `${username}@example.com`,
    passwordHash: 'hash',
  });
  const article = await articles.create({
    slug: `slug-${username}`,
    title: 'T',
    description: 'd',
    body: 'b',
    authorId: author.id,
    tagList: [],
  });
  return { slug: article.slug, authorId: author.id };
}

describe('CommentService', () => {
  it('creates and lists comments', async () => {
    const { service, users, articles } = await build();
    const { slug, authorId } = await seedArticle(users, articles, 'auth');
    await service.create(slug, { comment: { body: 'nice' } }, authorId);
    const list = await service.list(slug, null);
    expect(list.comments).toHaveLength(1);
    expect(list.comments[0].body).toBe('nice');
  });

  it('throws NotFoundError creating on a missing article', async () => {
    const { service } = await build();
    await expect(
      service.create('missing', { comment: { body: 'x' } }, 1),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('forbids deleting another user comment', async () => {
    const { service, users, articles } = await build();
    const { slug, authorId } = await seedArticle(users, articles, 'auth2');
    const created = await service.create(
      slug,
      { comment: { body: 'mine' } },
      authorId,
    );
    await expect(
      service.delete(slug, created.comment.id, authorId + 999),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws NotFoundError deleting a missing comment', async () => {
    const { service, users, articles } = await build();
    const { slug, authorId } = await seedArticle(users, articles, 'auth3');
    await expect(
      service.delete(slug, 4242, authorId),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
