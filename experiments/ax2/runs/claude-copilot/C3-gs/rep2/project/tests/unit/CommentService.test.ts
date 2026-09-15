import { CommentService } from '../../src/services/CommentService';
import { ProfileService } from '../../src/services/ProfileService';
import { ArticleService } from '../../src/services/ArticleService';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';
import { InMemoryProfileRepository } from '../fakes/InMemoryProfileRepository';
import { InMemoryArticleRepository } from '../fakes/InMemoryArticleRepository';
import { InMemoryCommentRepository } from '../fakes/InMemoryCommentRepository';
import { ForbiddenError, NotFoundError } from '../../src/errors/AppError';

/** Wire a CommentService with an article authored by `author`. */
async function setup() {
  const users = new InMemoryUserRepository();
  const profiles = new InMemoryProfileRepository();
  const articles = new InMemoryArticleRepository(users, profiles);
  const comments = new InMemoryCommentRepository();
  const profileService = new ProfileService(users, profiles);
  const articleService = new ArticleService(articles, users, profileService);
  const service = new CommentService(comments, articles, users, profileService);
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
  const article = await articleService.create(author.id, {
    title: 'Post',
    description: 'd',
    body: 'b',
  });
  return { service, slug: article.slug, authorId: author.id, otherId: other.id };
}

describe('CommentService', () => {
  it('creates a comment and returns the author profile', async () => {
    const { service, slug, authorId } = await setup();
    const comment = await service.create(slug, authorId, 'Nice post');
    expect(comment.body).toBe('Nice post');
    expect(comment.author.username).toBe('author');
  });

  it('lists comments newest first', async () => {
    const { service, slug, authorId } = await setup();
    await service.create(slug, authorId, 'first');
    await service.create(slug, authorId, 'second');
    const list = await service.list(slug);
    expect(list).toHaveLength(2);
    expect(list[0].body).toBe('second');
  });

  it('throws NotFoundError when commenting on a missing article', async () => {
    const { service, authorId } = await setup();
    await expect(service.create('missing', authorId, 'x')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('forbids deleting a comment by a non-author', async () => {
    const { service, slug, authorId, otherId } = await setup();
    const comment = await service.create(slug, authorId, 'mine');
    await expect(service.delete(slug, comment.id, otherId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('allows the author to delete their comment', async () => {
    const { service, slug, authorId } = await setup();
    const comment = await service.create(slug, authorId, 'mine');
    await service.delete(slug, comment.id, authorId);
    const list = await service.list(slug);
    expect(list).toHaveLength(0);
  });

  it('throws NotFoundError deleting an unknown comment', async () => {
    const { service, slug, authorId } = await setup();
    await expect(service.delete(slug, 999, authorId)).rejects.toBeInstanceOf(NotFoundError);
  });
});
