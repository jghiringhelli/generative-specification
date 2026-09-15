import { CommentService } from '../../src/services/CommentService';
import { InMemoryUserRepository } from '../helpers/InMemoryUserRepository';
import { InMemoryProfileRepository } from '../helpers/InMemoryProfileRepository';
import { InMemoryArticleRepository } from '../helpers/InMemoryArticleRepository';
import { InMemoryCommentRepository } from '../helpers/InMemoryCommentRepository';
import { ForbiddenError, NotFoundError, ValidationError } from '../../src/errors/AppError';
import { ArticleEntity, UserEntity } from '../../src/domain/types';

/**
 * Build a CommentService with in-memory dependencies, a seeded author and
 * article.
 */
async function build(): Promise<{
  service: CommentService;
  users: InMemoryUserRepository;
  author: UserEntity;
  article: ArticleEntity;
}> {
  const users = new InMemoryUserRepository();
  const profiles = new InMemoryProfileRepository();
  const articles = new InMemoryArticleRepository(users);
  const comments = new InMemoryCommentRepository();
  const service = new CommentService(comments, articles, users, profiles);
  const author = await users.create({
    email: 'author@example.com',
    username: 'author',
    passwordHash: 'x'
  });
  const article = await articles.create({
    slug: 'a-post',
    title: 'A Post',
    description: 'd',
    body: 'b',
    authorId: author.id,
    tagList: []
  });
  return { service, users, author, article };
}

describe('CommentService.addComment', () => {
  it('creates a comment', async () => {
    const { service, author } = await build();
    const result = await service.addComment('a-post', { comment: { body: 'hi' } }, author);
    expect(result.comment.body).toBe('hi');
    expect(result.comment.author.username).toBe('author');
  });

  it('rejects an empty body', async () => {
    const { service, author } = await build();
    await expect(
      service.addComment('a-post', { comment: { body: '' } }, author)
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws NotFoundError for an unknown article', async () => {
    const { service, author } = await build();
    await expect(
      service.addComment('ghost', { comment: { body: 'hi' } }, author)
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('CommentService.listForArticle', () => {
  it('returns comments in creation order', async () => {
    const { service, author } = await build();
    await service.addComment('a-post', { comment: { body: 'one' } }, author);
    await service.addComment('a-post', { comment: { body: 'two' } }, author);
    const result = await service.listForArticle('a-post', undefined);
    expect(result.comments.map((c) => c.body)).toEqual(['one', 'two']);
  });
});

describe('CommentService.deleteComment', () => {
  it('rejects deletion by a non-author', async () => {
    const { service, users, author } = await build();
    const created = await service.addComment('a-post', { comment: { body: 'hi' } }, author);
    const other = await users.create({
      email: 'other@example.com',
      username: 'other',
      passwordHash: 'x'
    });
    await expect(
      service.deleteComment('a-post', created.comment.id, other)
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws NotFoundError for an unknown comment', async () => {
    const { service, author } = await build();
    await expect(service.deleteComment('a-post', 999, author)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
});
