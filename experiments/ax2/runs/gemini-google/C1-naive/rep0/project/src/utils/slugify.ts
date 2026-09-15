import slugify from 'slugify';

export const createSlug = (title: string): string => {
  const baseSlug = slugify(title, { lower: true, strict: true, trim: true });
  const uniqueSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${uniqueSuffix}`;
};
