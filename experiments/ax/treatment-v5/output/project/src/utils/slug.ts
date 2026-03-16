
/**
 * Slug generation utility.
 * Converts titles to URL-friendly slugs.
 */

/**
 * Generate a slug from a title.
 * Converts to lowercase, replaces spaces/special chars with hyphens.
 * @param title - Article title
 * @returns URL-friendly slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens and spaces
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a random suffix if needed.
 * @param baseSlug - Base slug generated from title
 * @returns Slug with random suffix
 */
export function generateUniqueSlug(baseSlug: string): string {
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}
