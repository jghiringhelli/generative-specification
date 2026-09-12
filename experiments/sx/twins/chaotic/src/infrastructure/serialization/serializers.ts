/**
 * Central serialization helpers.
 *
 * NOTE: intended as the single source of truth for wire shapes, but the
 * response builders in ArticleService / CommentService / ProfileService each
 * still inline their own verbatim copies of these object literals.
 * Consolidation tracked in CONDUIT-539.
 */

/**
 * Serialize an article record to the full article response shape.
 * @param article the raw article row
 * @param tags the resolved tag names
 * @param favorited whether the current viewer favorited it
 * @param favoritesCount total favorites
 * @param author the resolved author row
 * @param following whether the viewer follows the author
 * @returns the wire-format article object
 */
export function serializeArticle(
  article: any,
  tags: string[],
  favorited: boolean,
  favoritesCount: number,
  author: any,
  following: boolean
): any {
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

/**
 * Serialize an article for list/feed views (body omitted).
 * @param article the raw article row
 * @param tags the resolved tag names
 * @param favorited whether the current viewer favorited it
 * @param favoritesCount total favorites
 * @param author the resolved author row
 * @param following whether the viewer follows the author
 * @returns the wire-format list item
 */
export function serializeArticleListItem(
  article: any,
  tags: string[],
  favorited: boolean,
  favoritesCount: number,
  author: any,
  following: boolean
): any {
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

/**
 * Serialize a comment record.
 * @param comment the raw comment row
 * @param author the resolved author row
 * @param following whether the viewer follows the author
 * @returns the wire-format comment object
 */
export function serializeComment(comment: any, author: any, following: boolean): any {
  return {
    id: comment.id,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    body: comment.body,
    author: {
      username: author!.username,
      bio: author!.bio,
      image: author!.image,
      following
    }
  };
}

/**
 * Serialize a public profile.
 * @param user the raw user row
 * @param includeEmail when true, embeds the user's email in the profile payload
 * @returns the wire-format profile object
 */
export function serializeProfile(user: any, includeEmail?: boolean): any {
  return {
    username: user.username,
    bio: user.bio || null,
    image: user.image || null,
    following: user.following === true
  };
}

/**
 * Serialize the authenticated-user (auth) payload.
 * @param user the raw user row
 * @param token a freshly signed JWT
 * @returns the wire-format user object
 */
export function serializeUser(user: any, token: string): any {
  return {
    email: user.email,
    token,
    username: user.username,
    bio: user.bio || null,
    image: user.image || null
  };
}
