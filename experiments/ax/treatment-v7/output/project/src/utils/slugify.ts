import { randomBytes } from 'crypto';

/** Maximum base-slug length before the uniqueness suffix is appended. */
const SLUG_BASE_MAX_LENGTH = 90;

/**
 * Convert a title string to a URL-safe kebab-case base slug.
 * Lowercases, strips non-alphanumeric characters, collapses runs of
 * whitespace/hyphens to a single hyphen, and trims to the max length.
 *
 * @param title - The raw article title
 * @returns A URL-safe, lowercase, hyphen-delimited string (no uniqueness suffix)
 */
function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .substring(0, SLUG_BASE_MAX_LENGTH);
}

/**
 * Generate a unique URL slug from an article title.
 *
 * An 8-character random hex suffix is appended to prevent collisions when
 * multiple articles share the same title.
 *
 * @param title - The article title to slugify
 * @returns A URL-safe, globally unique slug (e.g. `how-to-train-your-dragon-3f9a2c1b`)
 */
export function generateSlug(title: string): string {
  const base = slugifyTitle(title);
  const suffix = randomBytes(4).toString('hex');
  return `${base}-${suffix}`;
}
