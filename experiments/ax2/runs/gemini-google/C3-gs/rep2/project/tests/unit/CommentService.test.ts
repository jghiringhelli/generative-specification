import { CommentService } from '../../src/services/CommentService';
import { InMemoryCommentRepository } from '../../src/repositories/in-memory/InMemoryCommentRepository';
import { InMemoryUserRepository } from '../../src/repositories/in-memory/InMemoryUserRepository';
import { InMemoryProfileRepository } from '../../src/repositories/in-memory/InMemoryProfileRepository';
import { InMemoryArticleRepository } from '../../src/repositories/in-memory/InMemoryArticleRepository';
import { NotFoundError, ForbiddenError } from '../../src/errors/AppError';

describe('CommentService Unit Tests', () => {
  let userRepository: InMemoryUserRepository;
  let profileRepository: InMemoryProfileRepository;
  let articleRepository: InMemoryArticleRepository;
  let commentRepository: InMemoryCommentRepository;
  let commentService: CommentService;
  let authorId: string;
  let articleSlug: string;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    profileRepository = new InMemoryProfileRepository(userRepository);
    articleRepository = new InMemoryArticleRepository(userRepository, profileRepository);
    commentRepository = new InMemoryCommentRepository(userRepository, profileRepository, articleRepository);
    commentService = new CommentService(commentRepository);

    const user = await userRepository.create({
      username: 'commenter',
      email: 'commenter@example.com',
      passwordHash: 'hash',
    });
    authorId = user.id;

    const article = await articleRepository.create({
      title: 'Target Article',
      description: 'desc',
      body: 'body',
      tagList: [],
      authorId,
    });
    articleSlug = article.slug;
  });

  describe('createComment and getComments', () => {
    it('should create a comment and list it under the article', async () => {
      const created = await commentService.createComment(articleSlug, authorId, {
        body: 'Great article!',
      });

      expect(created.comment.body).toBe('Great article!');
      expect(created.comment.author.username).toBe('commenter');

      const result = await commentService.getComments(articleSlug);
      expect(result.comments.length).toBe(1);
      expect(result.comments[0].body).toBe('Great article!');
    });

    it('should throw NotFoundError when commenting on non-existent article', async () => {
      await expect(
        commentService.createComment('non-existent-slug', authorId, {
          body: 'Hello',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteComment', () => {
    it('should allow author to delete comment', async () => {
      const created = await commentService.createComment(articleSlug, authorId, {
        body: 'Delete me',
      });

      await expect(commentService.deleteComment(created.comment.id, authorId)).resolves.not.toThrow();

      const list = await commentService.getComments(articleSlug);
      expect(list.comments.length).toBe(0);
    });

    it('should forbid non-author from deleting comment', async () => {
      const created = await commentService.createComment(articleSlug, authorId, {
        body: 'Protected comment',
      });

      await expect(commentService.deleteComment(created.comment.id, 'another-user-id')).rejects.toThrow(
        ForbiddenError
      );
    });
  });
});
