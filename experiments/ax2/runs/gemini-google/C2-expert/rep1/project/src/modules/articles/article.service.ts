import { IArticleRepository, ArticleRepository, ArticleWithRelations } from './article.repository';
import { IProfileRepository, ProfileRepository } from '../profiles/profile.repository';
import {
  CreateArticleInput,
  UpdateArticleInput,
  ArticlesQuery,
  FeedQuery,
  ArticleData,
  ArticleListItemData,
  ArticlesListResponse
} from './article.dto';
import { slugify } from './slug.utils';
import { ForbiddenError, NotFoundError } from '../../errors/app-error';

export class ArticleService {
  constructor(
    private readonly articleRepository: IArticleRepository = new ArticleRepository(),
    private readonly profileRepository: IProfileRepository = new ProfileRepository()
  ) {}

  async createArticle(userId: string, input: CreateArticleInput): Promise<ArticleData> {
    const { title, description, body, tagList = [] } = input.article;
    const slug = slugify(title);

    const article = await this.articleRepository.create({
      slug,
      title,
      description,
      body,
      authorId: userId,
      tagList
    });

    return this.buildArticleData(article, userId, true);
  }

  async getArticle(slug: string, currentUserId?: string): Promise<ArticleData> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    return this.buildArticleData(article, currentUserId, true);
  }

  async updateArticle(
    slug: string,
    userId: string,
    input: UpdateArticleInput
  ): Promise<ArticleData> {
    const existing = await this.articleRepository.findBySlug(slug);
    if (!existing) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    if (existing.authorId !== userId) {
      throw new ForbiddenError('You are not authorized to edit this article');
    }

    const { title, description, body, tagList } = input.article;
    const newSlug = title ? slugify(title) : undefined;

    const updated = await this.articleRepository.update(slug, {
      title,
      description,
      body,
      slug: newSlug,
      tagList
    });

    return this.buildArticleData(updated, userId, true);
  }

  async deleteArticle(slug: string, userId: string): Promise<void> {
    const existing = await this.articleRepository.findBySlug(slug);
    if (!existing) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    if (existing.authorId !== userId) {
      throw new ForbiddenError('You are not authorized to delete this article');
    }

    await this.articleRepository.delete(slug);
  }

  async listArticles(
    query: ArticlesQuery,
    currentUserId?: string
  ): Promise<ArticlesListResponse> {
    const [articles, totalCount] = await Promise.all([
      this.articleRepository.findMany(query),
      this.articleRepository.count(query)
    ]);

    const items = await Promise.all(
      articles.map(async (art) => {
        const full = await this.buildArticleData(art, currentUserId, false);
        return full;
      })
    );

    return {
      articles: items,
      articlesCount: totalCount
    };
  }

  async getFeed(userId: string, query: FeedQuery): Promise<ArticlesListResponse> {
    const [articles, totalCount] = await Promise.all([
      this.articleRepository.findFeed(userId, query.limit, query.offset),
      this.articleRepository.countFeed(userId)
    ]);

    const items = await Promise.all(
      articles.map(async (art) => {
        const full = await this.buildArticleData(art, userId, false);
        return full;
      })
    );

    return {
      articles: items,
      articlesCount: totalCount
    };
  }

  async favoriteArticle(slug: string, userId: string): Promise<ArticleData> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    await this.articleRepository.favorite(userId, article.id);

    const reloaded = await this.articleRepository.findBySlug(slug);
    return this.buildArticleData(reloaded!, userId, true);
  }

  async unfavoriteArticle(slug: string, userId: string): Promise<ArticleData> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    await this.articleRepository.unfavorite(userId, article.id);

    const reloaded = await this.articleRepository.findBySlug(slug);
    return this.buildArticleData(reloaded!, userId, true);
  }

  private async buildArticleData(
    article: ArticleWithRelations,
    currentUserId?: string,
    includeBody = true
  ): Promise<any> {
    let following = false;
    if (currentUserId && currentUserId !== article.authorId) {
      following = await this.profileRepository.isFollowing(currentUserId, article.authorId);
    }

    const favorited = currentUserId
      ? article.favorites.some((fav) => fav.userId === currentUserId)
      : false;

    const favoritesCount = article.favorites.length;
    const tagList = article.tags.map((t) => t.name);

    const baseItem: ArticleListItemData = {
      slug: article.slug,
      title: article.title,
      description: article.description,
      tagList,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited,
      favoritesCount,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following
      }
    };

    if (includeBody) {
      return {
        ...baseItem,
        body: article.body
      } as ArticleData;
    }

    return baseItem;
  }
}
