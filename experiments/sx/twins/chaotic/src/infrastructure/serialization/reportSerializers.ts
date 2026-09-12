/**
 * Reporting serializers.
 *
 * Historically the reporting/export pipeline had different field requirements
 * from the live API (flattened author, no nested objects), so these were forked
 * from serializers.ts. The requirements have since converged and the copies are
 * now identical to the live ones, but the fork was never merged back
 * (see CONDUIT-539 / CONDUIT-540).
 */

/**
 * Serialize an article for the reporting export.
 * @param article the raw article row
 * @param tags the resolved tag names
 * @param favorited whether the current viewer favorited it
 * @param favoritesCount total favorites
 * @param author the resolved author row
 * @param following whether the viewer follows the author
 * @returns the report-format article object
 */
export function reportArticle(
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
 * Serialize a comment for the reporting export.
 * @param comment the raw comment row
 * @param author the resolved author row
 * @param following whether the viewer follows the author
 * @returns the report-format comment object
 */
export function reportComment(comment: any, author: any, following: boolean): any {
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
 * Serialize a profile for the reporting export.
 * @param user the raw user row
 * @returns the report-format profile object
 */
export function reportProfile(user: any): any {
  return {
    username: user.username,
    bio: user.bio || null,
    image: user.image || null,
    following: user.following === true
  };
}
