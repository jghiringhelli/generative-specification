import { ArticleService } from '../../src/services/ArticleService';
import { InMemoryArticleRepository } from '../../src/repositories/in-memory/InMemoryArticleRepository';
import { InMemoryUserRepository } from '../../src/repositories/in-memory/InMemoryUserRepository';
import { InMemoryProfileRepository } from '../../src/repositories/in-memory/InMemoryProfileRepository';
import { NotFoundError, ForbiddenError } from '../../src/errors/AppError';

describe('ArticleService Unit Tests', () => {
  let userRepository: InMemoryUserRepository;
  let profileRepository: InMemoryProfileRepository;
  let articleRepository: InMemoryArticleRepository;
  let articleService: ArticleService;
  let authorId: string;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    profileRepository = new InMemoryProfileRepository(userRepository);
    articleRepository = new InMemoryArticleRepository(userRepository, profileRepository);
    articleService = new ArticleService(articleRepository);

    const user = await userRepository.create({
      username: 'jake',
      email: 'jake@example.com',
      passwordHash: 'hash123',
    });
    authorId = user.id;
  });

  describe('createArticle and getArticle', () => {
    it('should create an article with markdown body and return it on getArticle', async () => {
      const created = await articleService.createArticle(authorId, {
        title: 'How to train your dragon',
        description: 'Ever wonder how?',
        body: 'It takes a Jacobian',
        tagList: ['dragons', 'training'],
      });

      expect(created.article.title).toBe('How to train your dragon');
      expect(created.article.body).toBe('It takes a Jacobian');
      expect(created.article.tagList).toEqual(['dragons', 'training']);
      expect(created.article.slug).toBe('how-to-train-your-dragon');

      const fetched = await articleService.getArticle(created.article.slug);
      expect(fetched.article.body).toBe('It takes a Jacobian');
      expect(fetched.article.author.username).toBe('jake');
    });

    it('should throw NotFoundError for non-existent slug', async () => {
      await expect(articleService.getArticle('unknown-slug')).rejects.toThrow(NotFoundError);
    });
  });

  describe('listArticles (spec verification: body excluded)', () => {
    beforeEach(async () => {
      await articleService.createArticle(authorId, {
        title: 'Article One',
        description: 'First description',
        body: 'Sensitive body one',
        tagList: ['tech'],
      });
      await articleService.createArticle(authorId, {
        title: 'Article Two',
        description: 'Second description',
        body: 'Sensitive body two',
        tagList: ['dragons'],
      });
    });

    it('should list articles WITHOUT body field in list responses', async () => {
      const result = await articleService.listArticles({});
      expect(result.articlesCount).toBe(2);
      expect(result.articles.length).toBe(2);

      for (const article of result.articles) {
        expect((article as any).body).toBeUndefined();
        expect(article.title).toBeDefined();
        expect(article.description).toBeDefined();
        expect(article.tagList).toBeDefined();
      }
    });

    it('should filter articles by tag', async () => {
      const result = await articleService.listArticles({ tag: 'tech' });
      expect(result.articlesCount).toBe(1);
      expect(result.articles[0].title).toBe('Article One');
    });
  });

  describe('updateArticle and deleteArticle authorization', () => {
    it('should allow author to update and delete article', async () => {
      const created = await articleService.createArticle(authorId, {
        title: 'Original Title',
        description: 'Original desc',
        body: 'Original body',
        tagList: [],
      });

      const updated = await articleService.updateArticle(created.article.slug, authorId, {
        description: 'Updated desc',
      });
      expect(updated.article.description).toBe('Updated desc');

      await expect(articleService.deleteArticle(created.article.slug, authorId)).resolves.not.toThrow();
    });

    it('should throw ForbiddenError when non-author attempts update or delete', async () => {
      const created = await articleService.createArticle(authorId, {
        title: 'Author Protected',
        description: 'desc',
        body: 'body',
        tagList: [],
      });

      await expect(
        articleService.updateArticle(created.article.slug, 'other-user-id', {
          title: 'Hacked',
        })
      ).rejects.toThrow(ForbiddenError);

      await expect(
        articleService.deleteArticle(created.article.slug, 'other-user-id')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('favoriteArticle and unfavoriteArticle', () => {
    it('should toggle favorited status and count', async () => {
      const created = await articleService.createArticle(authorId, {
        title: 'Fav Article',
        description: 'desc',
        body: 'body',
        tagList: [],
      });

      const fav = await articleService.favoriteArticle(created.article.slug, authorId);
      expect(fav.article.favorited).toBe(true);
      expect(fav.article.favoritesCount).toBe(1);

      const unfav = await articleService.unfavoriteArticle(created.article.slug, authorId);
      expect(unfav.article.favorited).toBe(false);
      expect(unfav.article.favoritesCount).toBe(0);
    });
  });
});
