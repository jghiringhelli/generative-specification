import { CommentService } from '../../src/comments/CommentService';
import { IArticleRepository, ArticleRecord } from '../../src/repositories/IArticleRepository';
import { ICommentRepository, CommentRecord } from '../../src/repositories/ICommentRepository';
import { IProfileRepository } from '../../src/repositories/IProfileRepository';
import { IUserRepository } from '../../src/repositories/IUserRepository';

const article: ArticleRecord = {
  id: 'article-id', slug: 'hello', title: 'Hello', description: 'Description',
  body: 'Body', tagList: [], authorId: 'author-id',
  createdAt: new Date(), updatedAt: new Date(),
};
const comment: CommentRecord = {
  id: 'comment-id', body: 'Comment', articleId: article.id, authorId: 'author-id',
  createdAt: new Date(), updatedAt: new Date(),
};

test('rejects comment deletion by a non-author', async () => {
  const comments = {
    listByArticle: jest.fn(), findById: jest.fn().mockResolvedValue(comment),
    create: jest.fn(), delete: jest.fn(),
  } as jest.Mocked<ICommentRepository>;
  const articles = {
    findBySlug: jest.fn().mockResolvedValue(article),
  } as unknown as jest.Mocked<IArticleRepository>;
  const users = {} as jest.Mocked<IUserRepository>;
  const profiles = {} as jest.Mocked<IProfileRepository>;
  const service = new CommentService(comments, articles, users, profiles);
  await expect(service.delete('hello', 'comment-id', 'other-id'))
    .rejects.toMatchObject({ statusCode: 403 });
});
