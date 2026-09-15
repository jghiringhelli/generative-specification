import { ProfileData } from './profile.types';

export interface ArticleListItem {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly tagList: readonly string[];
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
  readonly favorited: boolean;
  readonly favoritesCount: number;
  readonly author: ProfileData;
}

export interface SingleArticleData extends ArticleListItem {
  readonly body: string;
}

export interface SingleArticleResponse {
  readonly article: SingleArticleData;
}

export interface MultipleArticlesResponse {
  readonly articles: readonly ArticleListItem[];
  readonly articlesCount: number;
}

export interface CreateArticleInput {
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList?: readonly string[];
}

export interface UpdateArticleInput {
  readonly title?: string;
  readonly description?: string;
  readonly body?: string;
  readonly tagList?: readonly string[];
}

export interface ArticleFilterQuery {
  readonly tag?: string;
  readonly author?: string;
  readonly favorited?: string;
  readonly limit?: unknown;
  readonly offset?: unknown;
}
