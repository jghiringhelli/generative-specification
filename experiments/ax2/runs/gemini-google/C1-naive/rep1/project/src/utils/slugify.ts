export function slugify(text: string): string {
  const base = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return base ? `${base}-${randomSuffix}` : `article-${randomSuffix}`;
}
