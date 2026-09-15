import { ProfileResponse } from '../profiles/profile.types';

export interface ArticleRecord {
  readonly id: number;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly authorId: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly author: {
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
    readonly followers: ReadonlyArray<unknown>;
  };
  readonly tags: ReadonlyArray<{ readonly tag: { readonly name: string } }>;
  readonly favorites: ReadonlyArray<unknown>;
  readonly _count: { readonly favorites: number };
}

export interface ArticleResponse {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body?: string;
  readonly tagList: ReadonlyArray<string>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly favorited: boolean;
  readonly favoritesCount: number;
  readonly author: ProfileResponse;
}

export interface ArticleFilters {
  readonly tag?: string;
  readonly author?: string;
  readonly favorited?: string;
  readonly limit: number;
  readonly offset: number;
}

export interface CreateArticleData {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList: ReadonlyArray<string>;
  readonly authorId: number;
}

export interface UpdateArticleData {
  readonly slug?: string;
  readonly title?: string;
  readonly description?: string;
  readonly body?: string;
  readonly tagList?: ReadonlyArray<string>;
}
