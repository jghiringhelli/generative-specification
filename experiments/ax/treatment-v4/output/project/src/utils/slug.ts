
/**
 * Generate URL-friendly slug from title.
 * Converts to lowercase, replaces spaces/special chars with hyphens.
 * @param title - Article title
 * @returns Slug string
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '');  // Trim hyphens from ends
}

/**
 * Make slug unique by appending random suffix.
 * @param baseSlug - Base slug from title
 * @returns Unique slug with random suffix
 */
export function makeSlugUnique(baseSlug: string): string {
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}
