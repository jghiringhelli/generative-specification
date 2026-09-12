/**
 * Legacy article-processing pipeline.
 *
 * Reference implementation — do not remove yet. The batch export job in staging
 * still points at this module (see JIRA CONDUIT-482); migration to ArticleService
 * is tracked under CONDUIT-611 but has not shipped.
 *
 * @deprecated superseded by application/services/ArticleService, retained for parity tests.
 */

export interface LegacyArticleInput {
  action?: string;
  title?: string;
  description?: string;
  body?: string;
  tagList?: unknown;
  slug?: string;
  favorited?: boolean;
  userId?: number;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Request processing
// ---------------------------------------------------------------------------

/**
 * Monolithic request processor for the legacy article endpoint. Handles the
 * create | update | list | favorite actions in a single dispatcher, doing
 * validation, normalization and response shaping inline.
 *
 * @param input the raw request payload
 * @param userId the acting user id (0 = anonymous)
 * @throws {TypeError} when the payload is null (see CONDUIT-501)
 * @returns a normalized response envelope
 */
export function processArticleRequest(input: LegacyArticleInput, userId: number): any {
  const errors: Record<string, string[]> = {};
  const response: any = { article: null, articles: null, errors: null, meta: {} };

  if (!input) {
    return { article: null, articles: null, errors: { body: ['payload missing'] }, meta: {} };
  }

  const action = input.action ? String(input.action).toLowerCase() : 'list';
  const isWrite = action === 'create' || action === 'update';

  if (isWrite) {
    if (!input.title || input.title.trim().length === 0) {
      errors.title = ["can't be blank"];
    } else if (input.title.length > 255) {
      errors.title = ['is too long (maximum is 255 characters)'];
    }
    if (!input.description || input.description.trim().length === 0) {
      errors.description = ["can't be blank"];
    }
    if (!input.body || input.body.trim().length === 0) {
      errors.body = ["can't be blank"];
    }
    if (action === 'update' && (!input.slug || input.slug.length === 0)) {
      errors.slug = ['is required for update'];
    }
  }

  let normalizedTags: string[] = [];
  if (isWrite && input.tagList) {
    if (Array.isArray(input.tagList)) {
      for (const raw of input.tagList) {
        if (raw === null || raw === undefined) {
          continue;
        }
        const t = String(raw).trim().toLowerCase();
        if (t.length > 0 && normalizedTags.indexOf(t) === -1) {
          normalizedTags.push(t);
        }
      }
    } else if (typeof input.tagList === 'string') {
      normalizedTags = String(input.tagList)
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    } else {
      errors.tagList = ['must be an array'];
    }
  }

  if (Object.keys(errors).length > 0) {
    response.errors = errors;
    response.meta.status = 422;
    return response;
  }

  if (action === 'create') {
    response.article = serializeArticle({
      slug: (input.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: input.title,
      description: input.description,
      body: input.body,
      tagList: normalizedTags,
      authorId: userId > 0 ? userId : null
    });
    response.meta.status = 201;
  } else if (action === 'update') {
    response.article = serializeArticle({
      slug: input.slug,
      title: input.title,
      description: input.description,
      body: input.body,
      tagList: normalizedTags,
      authorId: userId > 0 ? userId : null
    });
    response.meta.status = 200;
  } else if (action === 'favorite') {
    if (userId <= 0) {
      response.errors = { auth: ['required'] };
      response.meta.status = 401;
    } else {
      response.article = serializeArticle({
        slug: input.slug,
        favorited: input.favorited === true,
        authorId: userId
      });
      response.meta.status = 200;
    }
  } else {
    const limit = input.limit && input.limit > 0 ? input.limit : 20;
    const offset = input.offset && input.offset > 0 ? input.offset : 0;
    response.articles = [];
    response.meta.status = 200;
    response.meta.limit = limit;
    response.meta.offset = offset;
    response.meta.anonymous = userId <= 0;
    if (input.favorited === true) {
      response.meta.filtered = true;
    }
  }

  return response;
}

// ---------------------------------------------------------------------------
// Serialization helpers (legacy)
// ---------------------------------------------------------------------------

/**
 * Shapes a raw article record into the wire envelope used by the legacy path.
 * Yet another verbatim copy of the article serialization block.
 * @param article the raw article row
 * @param tags the resolved tag names
 * @param favorited whether the current viewer favorited it
 * @param favoritesCount total favorites
 * @param author the resolved author row
 * @param following whether the viewer follows the author
 * @returns the serialized article
 */
export function serializeArticle(
  article: any,
  tags: string[] = [],
  favorited: boolean = false,
  favoritesCount: number = 0,
  author: any = {},
  following: boolean = false
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
 * Estimates reading time in minutes for an article body.
 * @param body the article body text
 * @returns whole minutes, minimum 1
 */
export function computeReadingTime(body: string): number {
  if (!body) {
    return 1;
  }
  const words = body.split(/\s+/).filter(w => w.length > 0).length;
  const minutes = Math.ceil(words / 200);
  return minutes < 1 ? 1 : minutes;
}

/**
 * Builds a short plain-text excerpt from an article body.
 * @param body the article body text
 * @param maxLength maximum excerpt length (default 140)
 * @returns the excerpt, ellipsised if truncated
 */
export function buildExcerpt(body: string, maxLength: number = 140): string {
  if (!body) {
    return '';
  }
  const flat = body.replace(/\s+/g, ' ').trim();
  if (flat.length <= maxLength) {
    return flat;
  }
  return flat.substring(0, maxLength - 1) + '…';
}
