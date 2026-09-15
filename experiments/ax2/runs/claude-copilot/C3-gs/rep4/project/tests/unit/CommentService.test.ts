import { CommentService } from '../../src/services/CommentService';
import { ArticleService } from '../../src/services/ArticleService';
import {
  InMemoryArticleRepository,
  InMemoryCommentRepository,
  InMemoryProfileRepository,
  InMemoryStore,
  InMemoryUserRepository,
} from '../helpers/inMemory';
import { ForbiddenError, NotFoundError } from '../../src/errors/AppError';

async function seed() {
  const store = new InMemoryStore();
  const users = new InMemoryUserRepository(store);
  const profiles = new InMemoryProfileRepository(store);
  const articles = new InMemoryArticleRepository(store);
  const comments = new InMemoryCommentRepository(store);
  const author = await users.create({ email: 'a@e.com', username: 'author', passwordHash: 'h' });
  const other = await users.create({ email: 'o@e.com', username: 'other', passwordHash: 'h' });
  const articleService = new ArticleService(articles, profiles);
  const created = await articleService.createArticle(author.id, {
    title: 'Post',
    description: 'd',
    body: 'b',
    tagList: [],
  });
  const service = new CommentService(comments, articles, profiles);
  return { service, author, other, slug: created.slug };
}

describe('CommentService', () => {
  it('adds a comment to an article', async () => {
    const { service, author, slug } = await seed();
    const comment = await service.addComment(slug, author.id, { body: 'nice' });
    expect(comment.body).toBe('nice');
    expect(comment.author.username).toBe('author');
  });

  it('addComment throws NotFoundError for unknown article', async () => {
    const { service, author } = await seed();
    await expect(
      service.addComment('missing', author.id, { body: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lists comments oldest first', async () => {
    const { service, author, slug } = await seed();
    await service.addComment(slug, author.id, { body: 'one' });
    await service.addComment(slug, author.id, { body: 'two' });
    const { comments } = await service.listComments(slug, null);
    expect(comments.map((c) => c.body)).toEqual(['one', 'two']);
  });

  it('deletes a comment authored by the requester', async () => {
    const { service, author, slug } = await seed();
    const comment = await service.addComment(slug, author.id, { body: 'del' });
    await service.deleteComment(slug, comment.id, author.id);
    const { comments } = await service.listComments(slug, null);
    expect(comments).toHaveLength(0);
  });

  it('rejects deletion by a non-author with ForbiddenError', async () => {
    const { service, author, other, slug } = await seed();
    const comment = await service.addComment(slug, author.id, { body: 'mine' });
    await expect(
      service.deleteComment(slug, comment.id, other.id),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws NotFoundError deleting a missing comment', async () => {
    const { service, author, slug } = await seed();
    await expect(service.deleteComment(slug, 12345, author.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
