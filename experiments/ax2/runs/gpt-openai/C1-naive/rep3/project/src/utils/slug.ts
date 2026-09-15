import { randomUUID } from 'node:crypto';

export function createSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'article'}-${randomUUID().slice(0, 8)}`;
}
