/**
 * Slug derivation for articles.
 *
 * A slug is a URL-safe projection of the title. Uniqueness is the service's
 * concern (it appends a suffix on collision); this module owns only the pure,
 * deterministic base transform so it can be unit-tested without a repository.
 *
 * @gs-links: docs/specs/articles.md
 */

/**
 * Derive a URL-safe base slug from an article title.
 *
 * Lower-cases, strips accents/diacritics, and collapses any run of
 * non-alphanumeric characters to a single hyphen, trimming leading/trailing
 * hyphens. A title with no slug-able characters yields `'article'` so the
 * result is never empty.
 *
 * @param title - the human-readable article title.
 * @returns the base slug (caller ensures uniqueness).
 */
export function slugify(title: string): string {
  const base = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length > 0 ? base : 'article';
}
