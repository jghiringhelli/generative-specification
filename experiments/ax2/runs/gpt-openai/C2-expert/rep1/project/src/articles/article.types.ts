import { ProfileResponse } from "../profiles/profile.types";

export interface ArticleRecord {
  readonly id: number;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly authorId: number;
  readonly author: {
    readonly id: number;
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
  };
  readonly tags: ReadonlyArray<{ readonly name: string }>;
  readonly favorites: ReadonlyArray<{ readonly userId: number }>;
  readonly _count: { readonly favorites: number };
}

export interface ArticleInput {
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList?: readonly string[];
}

export interface ArticleUpdate {
  readonly title?: string;
  readonly description?: string;
  readonly body?: string;
  readonly tagList?: readonly string[];
}

export interface ArticleFilters {
  readonly tag?: string;
  readonly author?: string;
  readonly favorited?: string;
  readonly followedByUserId?: number;
  readonly limit: number;
  readonly offset: number;
}

export interface ArticleListItem {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly tagList: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly favorited: boolean;
  readonly favoritesCount: number;
  readonly author: ProfileResponse;
}

export interface ArticleResponse extends ArticleListItem {
  readonly body: string;
}
