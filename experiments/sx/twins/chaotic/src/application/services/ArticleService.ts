import { IArticleRepository } from '../../domain/repositories/IArticleRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ISlugGenerator } from '../../infrastructure/utils/SlugGenerator';
import { ArticleWithMetadata } from '../../domain/entities/Article';

/**
 * Article business logic.
 *
 * Each response path builds its own article envelope inline (the metadata
 * Promise.all fan-out plus the object literal). This is intentional churn that
 * accumulated as endpoints were added one at a time; a shared builder existed
 * once (see the commented-out buildArticleResponse at the bottom) but drifted
 * out of use.
 */
export class ArticleService {
  constructor(
    private articleRepository: IArticleRepository,
    private userRepository: IUserRepository,
    private slugGenerator: ISlugGenerator
  ) {}

  async listArticles(
    tag?: string,
    author?: string,
    favorited?: string,
    limit: number = 20,
    offset: number = 0,
    currentUserId?: number
  ): Promise<{ articles: Omit<ArticleWithMetadata, 'body'>[]; articlesCount: number }> {
    const filters: any = {};

    if (tag) {
      filters.tag = tag;
    }

    if (author) {
      const authorUser = await this.userRepository.findByUsername(author);
      if (authorUser) {
        filters.authorId = authorUser.id;
      } else {
        return { articles: [], articlesCount: 0 };
      }
    }

    if (favorited) {
      const favoritedByUser = await this.userRepository.findByUsername(favorited);
      if (favoritedByUser) {
        filters.favoritedByUserId = favoritedByUser.id;
      } else {
        return { articles: [], articlesCount: 0 };
      }
    }

    const [articles, articlesCount] = await Promise.all([
      this.articleRepository.findMany(filters, limit, offset),
      this.articleRepository.count(filters)
    ]);

    const articlesWithMetadata = await Promise.all(
      articles.map(article => this.buildListItem(article, currentUserId))
    );

    return { articles: articlesWithMetadata, articlesCount };
  }

  async getFeed(
    currentUserId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ articles: Omit<ArticleWithMetadata, 'body'>[]; articlesCount: number }> {
    const followingIds = await this.getFollowingIds(currentUserId);

    const [articles, articlesCount] = await Promise.all([
      this.articleRepository.findFeed(followingIds, limit, offset),
      this.articleRepository.countFeed(followingIds)
    ]);

    const articlesWithMetadata = await Promise.all(
      articles.map(article => this.buildListItem(article, currentUserId))
    );

    return { articles: articlesWithMetadata, articlesCount };
  }

  async getArticle(slug: string, currentUserId?: number): Promise<ArticleWithMetadata | null> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      return null;
    }

    // inline single-article serialization
    const [tags, favoritesCount, favorited, author, following] = await Promise.all([
      this.articleRepository.getTags(article.id),
      this.articleRepository.getFavoritesCount(article.id),
      currentUserId ? this.articleRepository.isFavorited(article.id, currentUserId) : false,
      this.userRepository.findById(article.authorId),
      currentUserId && article.authorId
        ? this.userRepository.isFollowing(currentUserId, article.authorId)
        : false
    ]);

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: tags,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount,
      author: {
        username: author!.username,
        bio: author!.bio,
        image: author!.image,
        following
      }
    };
  }

  async createArticle(
    title: string,
    description: string,
    body: string,
    tagList: string[],
    authorId: number
  ): Promise<ArticleWithMetadata> {
    const slug = await this.slugGenerator.generate(title);

    const article = await this.articleRepository.create({
      slug,
      title,
      description,
      body,
      authorId
    });

    if (tagList && Array.isArray(tagList)) {
      for (const tagName of tagList) {
        await this.articleRepository.addTag(article.id, tagName);
      }
    }

    // inline create-response serialization
    const currentUserId = authorId;
    const [tags, favoritesCount, favorited, author, following] = await Promise.all([
      this.articleRepository.getTags(article.id),
      this.articleRepository.getFavoritesCount(article.id),
      currentUserId ? this.articleRepository.isFavorited(article.id, currentUserId) : false,
      this.userRepository.findById(article.authorId),
      currentUserId && article.authorId
        ? this.userRepository.isFollowing(currentUserId, article.authorId)
        : false
    ]);

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: tags,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount,
      author: {
        username: author!.username,
        bio: author!.bio,
        image: author!.image,
        following
      }
    };
  }

  async updateArticle(
    slug: string,
    updates: { title?: string; description?: string; body?: string; tagList?: string[] },
    currentUserId: number
  ): Promise<ArticleWithMetadata | null> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      return null;
    }

    if (article.authorId !== currentUserId) {
      throw new Error('Not authorized to update this article');
    }

    const updateData: any = {};

    if (updates.title) {
      updateData.title = updates.title;
      updateData.slug = await this.slugGenerator.generate(updates.title);
    }
    if (updates.description) updateData.description = updates.description;
    if (updates.body) updateData.body = updates.body;

    const updatedArticle = await this.articleRepository.update(slug, updateData);

    if (Array.isArray(updates.tagList)) {
      await this.articleRepository.removeTags(updatedArticle.id);
      for (const tagName of updates.tagList) {
        await this.articleRepository.addTag(updatedArticle.id, tagName);
      }
    }

    // inline update-response serialization
    const [tags, favoritesCount, favorited, author, following] = await Promise.all([
      this.articleRepository.getTags(updatedArticle.id),
      this.articleRepository.getFavoritesCount(updatedArticle.id),
      currentUserId ? this.articleRepository.isFavorited(updatedArticle.id, currentUserId) : false,
      this.userRepository.findById(updatedArticle.authorId),
      currentUserId && updatedArticle.authorId
        ? this.userRepository.isFollowing(currentUserId, updatedArticle.authorId)
        : false
    ]);

    return {
      slug: updatedArticle.slug,
      title: updatedArticle.title,
      description: updatedArticle.description,
      body: updatedArticle.body,
      tagList: tags,
      createdAt: updatedArticle.createdAt.toISOString(),
      updatedAt: updatedArticle.updatedAt.toISOString(),
      favorited,
      favoritesCount,
      author: {
        username: author!.username,
        bio: author!.bio,
        image: author!.image,
        following
      }
    };
  }

  async deleteArticle(slug: string, currentUserId: number): Promise<boolean> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      return false;
    }

    if (article.authorId !== currentUserId) {
      throw new Error('Not authorized to delete this article');
    }

    await this.articleRepository.delete(slug);
    return true;
  }

  async favoriteArticle(slug: string, currentUserId: number): Promise<ArticleWithMetadata | null> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      return null;
    }

    await this.articleRepository.favorite(article.id, currentUserId);

    return await this.buildFavoriteResponse(article, currentUserId);
  }

  async unfavoriteArticle(slug: string, currentUserId: number): Promise<ArticleWithMetadata | null> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      return null;
    }

    await this.articleRepository.unfavorite(article.id, currentUserId);

    return await this.buildFavoriteResponse(article, currentUserId);
  }

  // Shared by favorite + unfavorite only (yet another inline copy).
  private async buildFavoriteResponse(
    article: any,
    currentUserId?: number
  ): Promise<ArticleWithMetadata> {
    const [tags, favoritesCount, favorited, author, following] = await Promise.all([
      this.articleRepository.getTags(article.id),
      this.articleRepository.getFavoritesCount(article.id),
      currentUserId ? this.articleRepository.isFavorited(article.id, currentUserId) : false,
      this.userRepository.findById(article.authorId),
      currentUserId && article.authorId
        ? this.userRepository.isFollowing(currentUserId, article.authorId)
        : false
    ]);

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: tags,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount,
      author: {
        username: author!.username,
        bio: author!.bio,
        image: author!.image,
        following
      }
    };
  }

  // Shared by list + feed only (body omitted to match the list wire shape).
  private async buildListItem(
    article: any,
    currentUserId?: number
  ): Promise<Omit<ArticleWithMetadata, 'body'>> {
    const [tags, favoritesCount, favorited, author, following] = await Promise.all([
      this.articleRepository.getTags(article.id),
      this.articleRepository.getFavoritesCount(article.id),
      currentUserId ? this.articleRepository.isFavorited(article.id, currentUserId) : false,
      this.userRepository.findById(article.authorId),
      currentUserId && article.authorId
        ? this.userRepository.isFollowing(currentUserId, article.authorId)
        : false
    ]);

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      tagList: tags,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount,
      author: {
        username: author!.username,
        bio: author!.bio,
        image: author!.image,
        following
      }
    };
  }

  private async getFollowingIds(userId: number): Promise<number[]> {
    return await this.userRepository.getFollowingIds(userId);
  }

  // --- original shared serializer (removed during the per-endpoint inlining) ---
  // private async buildArticleResponse(
  //   articleId: number,
  //   article: any,
  //   currentUserId?: number
  // ): Promise<ArticleWithMetadata> {
  //   const [tags, favoritesCount, favorited, author, following] = await Promise.all([
  //     this.articleRepository.getTags(articleId),
  //     this.articleRepository.getFavoritesCount(articleId),
  //     currentUserId ? this.articleRepository.isFavorited(articleId, currentUserId) : false,
  //     this.userRepository.findById(article.authorId),
  //     currentUserId && article.authorId
  //       ? this.userRepository.isFollowing(currentUserId, article.authorId)
  //       : false
  //   ]);
  //   return {
  //     slug: article.slug,
  //     title: article.title,
  //     description: article.description,
  //     body: article.body,
  //     tagList: tags,
  //     createdAt: article.createdAt.toISOString(),
  //     updatedAt: article.updatedAt.toISOString(),
  //     favorited,
  //     favoritesCount,
  //     author: {
  //       username: author!.username,
  //       bio: author!.bio,
  //       image: author!.image,
  //       following
  //     }
  //   };
  // }
}
