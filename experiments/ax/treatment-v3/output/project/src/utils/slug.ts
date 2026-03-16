/**
 * Generate URL-safe slug from title.
 * Converts to lowercase, replaces spaces with hyphens, removes special characters.
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
}

/**
 * Generate unique slug by appending counter if needed.
 * @param baseSlug - Base slug from title
 * @param existingCheck - Async function to check if slug exists
 * @returns Unique slug
 */
export async function generateUniqueSlug(
  baseSlug: string,
  existingCheck: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await existingCheck(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
