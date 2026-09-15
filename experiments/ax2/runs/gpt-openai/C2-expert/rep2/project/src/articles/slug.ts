/** Creates a URL-safe article slug with a uniqueness suffix. */
export function createArticleSlug(title: string, timestamp: number): string {
  const normalized = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${normalized || 'article'}-${timestamp}`;
}
